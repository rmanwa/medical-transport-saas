import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
@UseGuards(JwtAuthGuard)
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: RequestWithUser) {
    return this.prisma.hospital.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { name: 'asc' },
    });
  }
}
