"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftsController = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const email_service_1 = require("../email/email.service");
const branch_access_1 = require("../common/access/branch-access");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let ShiftsController = class ShiftsController {
    prisma;
    auditService;
    emailService;
    constructor(prisma, auditService, emailService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.emailService = emailService;
    }
    async createShift(branchId, body, req) {
        await (0, branch_access_1.assertBranchAccess)(this.prisma, req.user, branchId);
        if (!body?.patientId || !body?.startTime || !body?.endTime) {
            throw new common_1.BadRequestException('Missing required fields: patientId, startTime, endTime.');
        }
        const start = new Date(body.startTime);
        const end = new Date(body.endTime);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            throw new common_1.BadRequestException('startTime/endTime must be valid ISO date strings.');
        }
        if (end <= start) {
            throw new common_1.BadRequestException('endTime must be after startTime.');
        }
        const patient = await this.prisma.patient.findFirst({
            where: { id: body.patientId, branchId },
        });
        if (!patient) {
            throw new common_1.BadRequestException('Patient not found in this branch.');
        }
        let hospitalName;
        if (body.hospitalId) {
            const hospital = await this.prisma.hospital.findFirst({
                where: { id: body.hospitalId, companyId: req.user.companyId },
                select: { id: true, name: true },
            });
            if (!hospital) {
                throw new common_1.BadRequestException('Hospital not found in your company.');
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
                type: body.type ?? client_1.MeetingType.PHYSICAL,
                priority: body.priority ?? client_1.Priority.NORMAL,
                hospitalId: body.hospitalId ?? null,
            },
            include: { branch: true },
        });
        const patientName = `${patient.firstName} ${patient.lastName}`;
        this.auditService.log({
            action: 'APPOINTMENT_CREATED',
            entityId: shift.id,
            entityType: 'Shift',
            details: {
                patientName,
                startTime: shift.startTime,
                endTime: shift.endTime,
                branchName: shift.branch.name,
                type: shift.type,
                priority: shift.priority,
            },
            userId: req.user.id,
            companyId: req.user.companyId,
        }).catch(() => { });
        if (patient.email) {
            this.emailService.sendAppointmentNotification(patient.email, patientName, shift.startTime, shift.endTime, shift.type, shift.branch.name, hospitalName).catch(() => { });
        }
        this.prisma.user.findMany({
            where: { companyId: req.user.companyId, role: 'SUPER_ADMIN' },
            select: { email: true, name: true },
        }).then((admins) => {
            const startFormatted = shift.startTime.toLocaleString('en-US', { timeZone: 'America/Phoenix' });
            for (const admin of admins) {
                this.emailService.sendMail({
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
                }).catch(() => { });
            }
        }).catch(() => { });
        return shift;
    }
};
exports.ShiftsController = ShiftsController;
__decorate([
    (0, common_1.Post)('branches/:branchId/shifts'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ShiftsController.prototype, "createShift", null);
exports.ShiftsController = ShiftsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        email_service_1.EmailService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map