import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { assertBranchAccess } from '../common/access/branch-access';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

type CreatePatientBody = {
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // ISO string
  email?: string;      // ← NEW: optional client email
};

type UpdatePatientBody = {
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  email?: string;      // ← NEW
};

@UseGuards(JwtAuthGuard)
@Controller()
export class PatientsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,  // ← NEW
  ) {}

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

    const patient = await this.prisma.patient.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        gender: body.gender.trim(),
        dateOfBirth: dob,
        email: body.email?.trim() || null,  // ← NEW
        branchId,
      },
      include: { branch: true },
    });

    // ── Audit log (fire-and-forget) ──
    this.auditService.log({
      action: 'CLIENT_CREATED',
      entityId: patient.id,
      entityType: 'Patient',
      details: {
        clientName: `${patient.firstName} ${patient.lastName}`,
        branchName: patient.branch.name,
      },
      userId: req.user.id,
      companyId: req.user.companyId,
    }).catch(() => {});

    return patient;
  }

  @Patch('branches/:branchId/patients/:patientId')
  async updatePatient(
    @Param('branchId') branchId: string,
    @Param('patientId') patientId: string,
    @Body() body: UpdatePatientBody,
    @Req() req: RequestWithUser,
  ) {
    await assertBranchAccess(this.prisma, req.user, branchId);

    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName.trim();
    if (body.lastName !== undefined) updateData.lastName = body.lastName.trim();
    if (body.gender !== undefined) updateData.gender = body.gender.trim();
    if (body.dateOfBirth !== undefined) {
      const dob = new Date(body.dateOfBirth);
      if (Number.isNaN(dob.getTime())) {
        throw new BadRequestException('dateOfBirth must be a valid ISO date string.');
      }
      updateData.dateOfBirth = dob;
    }
    if (body.email !== undefined) updateData.email = body.email?.trim() || null; // ← NEW

    const patient = await this.prisma.patient.update({
      where: { id: patientId },
      data: updateData,
    });

    // ── Audit log (fire-and-forget) ──
    this.auditService.log({
      action: 'CLIENT_UPDATED',
      entityId: patient.id,
      entityType: 'Patient',
      details: {
        clientName: `${patient.firstName} ${patient.lastName}`,
        updatedFields: Object.keys(body),
      },
      userId: req.user.id,
      companyId: req.user.companyId,
    }).catch(() => {});

    return patient;
  }

  @Delete('branches/:branchId/patients/:patientId')
  async deletePatient(
    @Param('branchId') branchId: string,
    @Param('patientId') patientId: string,
    @Req() req: RequestWithUser,
  ) {
    await assertBranchAccess(this.prisma, req.user, branchId);

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, branchId },
    });
    if (!patient) throw new BadRequestException('Patient not found in this branch.');

    await this.prisma.patient.delete({ where: { id: patientId } });

    // ── Audit log (fire-and-forget) ──
    this.auditService.log({
      action: 'CLIENT_DELETED',
      entityId: patientId,
      entityType: 'Patient',
      details: {
        clientName: `${patient.firstName} ${patient.lastName}`,
      },
      userId: req.user.id,
      companyId: req.user.companyId,
    }).catch(() => {});

    return { ok: true };
  }
}