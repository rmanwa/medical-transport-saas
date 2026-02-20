import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithUser) {
    const user = req.user;

    // SUPER_ADMIN (or floater later) -> all branches in company
    if (user.role === 'SUPER_ADMIN' || user.canAccessAllBranches) {
      return this.prisma.branch.findMany({
        where: { companyId: user.companyId },
        orderBy: { name: 'asc' },
      });
    }

    // Staff -> only assigned branches
    return this.prisma.branch.findMany({
      where: { id: { in: user.branchIds }, companyId: user.companyId },
      orderBy: { name: 'asc' },
    });
  }
}
