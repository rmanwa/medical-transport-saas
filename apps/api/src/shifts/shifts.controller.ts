import { BadRequestException, Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MeetingType, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { assertBranchAccess } from '../common/access/branch-access';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type CreateShiftBody = {
  patientId: string;
  startTime: string; // ISO
  endTime: string; // ISO
  notes?: string;
  type?: MeetingType; // PHYSICAL | VIRTUAL
  priority?: Priority; // NORMAL | URGENT
  hospitalId?: string | null;
};

@UseGuards(JwtAuthGuard)
@Controller()
export class ShiftsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('branches/:branchId/shifts')
  async createShift(
    @Param('branchId') branchId: string,
    @Body() body: CreateShiftBody,
    @Req() req: RequestWithUser,
  ) {
    await assertBranchAccess(this.prisma, req.user, branchId);

    if (!body?.patientId || !body?.startTime || !body?.endTime) {
      throw new BadRequestException('Missing required fields: patientId, startTime, endTime.');
    }

    const start = new Date(body.startTime);
    const end = new Date(body.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('startTime/endTime must be valid ISO date strings.');
    }
    if (end <= start) {
      throw new BadRequestException('endTime must be after startTime.');
    }

    // Ensure patient belongs to the branch (prevents cross-branch scheduling)
    const patient = await this.prisma.patient.findFirst({
      where: { id: body.patientId, branchId },
      select: { id: true },
    });
    if (!patient) {
      throw new BadRequestException('Patient not found in this branch.');
    }

    // If hospitalId provided, ensure hospital belongs to the same company (shared master list)
    if (body.hospitalId) {
      const hospital = await this.prisma.hospital.findFirst({
        where: { id: body.hospitalId, companyId: req.user.companyId },
        select: { id: true },
      });
      if (!hospital) {
        throw new BadRequestException('Hospital not found in your company.');
      }
    }

    return this.prisma.shift.create({
      data: {
        branchId,
        patientId: body.patientId,
        startTime: start,
        endTime: end,
        notes: body.notes ?? null,
        type: body.type ?? MeetingType.PHYSICAL,
        priority: body.priority ?? Priority.NORMAL,
        hospitalId: body.hospitalId ?? null,
      },
    });
  }
}
