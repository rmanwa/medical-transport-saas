import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { assertBranchAccess } from '../common/access/branch-access';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type CreatePatientBody = {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // ISO string
};

@UseGuards(JwtAuthGuard)
@Controller()
export class PatientsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('branches/:branchId/patients')
  async listPatients(@Param('branchId') branchId: string, @Req() req: RequestWithUser) {
    await assertBranchAccess(this.prisma, req.user, branchId);

    return this.prisma.patient.findMany({
      where: { branchId },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  @Post('branches/:branchId/patients')
  async createPatient(
    @Param('branchId') branchId: string,
    @Body() body: CreatePatientBody,
    @Req() req: RequestWithUser,
  ) {
    await assertBranchAccess(this.prisma, req.user, branchId);

    if (!body?.firstName || !body?.lastName || !body?.gender || !body?.dateOfBirth) {
      throw new BadRequestException('Missing required fields: firstName, lastName, gender, dateOfBirth.');
    }

    const dob = new Date(body.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      throw new BadRequestException('dateOfBirth must be a valid ISO date string.');
    }

    return this.prisma.patient.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        gender: body.gender.trim(),
        dateOfBirth: dob,
        branchId,
      },
    });
  }
}
