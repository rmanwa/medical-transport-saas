import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMe(@Req() req: RequestWithUser) {
    const userId = req.user.id;

    // Fetch the user with their branch assignments from UserBranch junction table
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        companyId: true,
        canAccessAllBranches: true,
        mustChangePassword: true,
        // 'branches' is the relation name on User in your Prisma schema.
        // Each Branch record has an 'id' field we use as branchId.
        branches: {
          select: { branchId: true },
        },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        canAccessAllBranches: user.canAccessAllBranches,
        mustChangePassword: user.mustChangePassword,
        branchIds: user.branches.map((ub) => ub.branchId),
      },
    };
  }
}