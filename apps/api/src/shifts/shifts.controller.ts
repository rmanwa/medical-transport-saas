import { BadRequestException, Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { MeetingType, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,   // ← NEW
    private readonly emailService: EmailService,    // ← NEW
  ) {}

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
    });
    if (!patient) {
      throw new BadRequestException('Patient not found in this branch.');
    }

    // If hospitalId provided, ensure hospital belongs to the same company
    let hospitalName: string | undefined;
    if (body.hospitalId) {
      const hospital = await this.prisma.hospital.findFirst({
        where: { id: body.hospitalId, companyId: req.user.companyId },
        select: { id: true, name: true },
      });
      if (!hospital) {
        throw new BadRequestException('Hospital not found in your company.');
      }
      hospitalName = hospital.name;
    }

    const shift = await this.prisma.shift.create({
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
      include: { branch: true },
    });

    // ── Audit log ──
    await this.auditService.log({
      action: 'APPOINTMENT_CREATED',
      entityId: shift.id,
      entityType: 'Shift',
      details: {
        patientName: `${patient.firstName} ${patient.lastName}`,
        startTime: shift.startTime,
        endTime: shift.endTime,
        branchName: shift.branch.name,
        type: shift.type,
        priority: shift.priority,
      },
      userId: req.user.id,
      companyId: req.user.companyId,
    });

    // ── Email notification to patient ──
    if (patient.email) {
      try {
        await this.emailService.sendAppointmentNotification(
          patient.email,
          `${patient.firstName} ${patient.lastName}`,
          shift.startTime,
          shift.endTime,
          shift.type,
          shift.branch.name,
          hospitalName,
        );
      } catch {
        // Don't fail the request if email send fails
      }
    }

    // ── Email notification to manager (SUPER_ADMIN) ──
    try {
      const admins = await this.prisma.user.findMany({
        where: { companyId: req.user.companyId, role: 'SUPER_ADMIN' },
        select: { email: true, name: true },
      });

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const startFormatted = shift.startTime.toLocaleString('en-US', { timeZone: 'America/Phoenix' });

      for (const admin of admins) {
        await this.emailService.sendMail({
          to: admin.email,
          subject: `New Appointment Created – ${patientName}`,
          html: `
            <h2>New Appointment Scheduled</h2>
            <p>Hi ${admin.name},</p>
            <p>A new appointment has been created:</p>
            <table style="border-collapse:collapse;margin:16px 0;">
              <tr><td style="padding:6px 12px;font-weight:bold;">Patient</td><td style="padding:6px 12px;">${patientName}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;">Branch</td><td style="padding:6px 12px;">${shift.branch.name}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;">Date/Time</td><td style="padding:6px 12px;">${startFormatted}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;">Type</td><td style="padding:6px 12px;">${shift.type}</td></tr>
              <tr><td style="padding:6px 12px;font-weight:bold;">Priority</td><td style="padding:6px 12px;">${shift.priority}</td></tr>
              ${hospitalName ? `<tr><td style="padding:6px 12px;font-weight:bold;">Hospital</td><td style="padding:6px 12px;">${hospitalName}</td></tr>` : ''}
            </table>
            <p style="color:#888;font-size:12px;">This is an automated notification from your clinic dashboard.</p>
          `,
        });
      }
    } catch {
      // Don't fail the request if admin email fails
    }

    return shift;
  }
}