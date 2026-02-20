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
const branch_access_1 = require("../common/access/branch-access");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let ShiftsController = class ShiftsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
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
            select: { id: true },
        });
        if (!patient) {
            throw new common_1.BadRequestException('Patient not found in this branch.');
        }
        if (body.hospitalId) {
            const hospital = await this.prisma.hospital.findFirst({
                where: { id: body.hospitalId, companyId: req.user.companyId },
                select: { id: true },
            });
            if (!hospital) {
                throw new common_1.BadRequestException('Hospital not found in your company.');
            }
        }
        return this.prisma.shift.create({
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
        });
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftsController);
//# sourceMappingURL=shifts.controller.js.map