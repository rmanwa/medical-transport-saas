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
exports.PatientsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const branch_access_1 = require("../common/access/branch-access");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let PatientsController = class PatientsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPatients(branchId, req) {
        await (0, branch_access_1.assertBranchAccess)(this.prisma, req.user, branchId);
        return this.prisma.patient.findMany({
            where: { branchId },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });
    }
    async createPatient(branchId, body, req) {
        await (0, branch_access_1.assertBranchAccess)(this.prisma, req.user, branchId);
        if (!body?.firstName || !body?.lastName || !body?.gender || !body?.dateOfBirth) {
            throw new common_1.BadRequestException('Missing required fields: firstName, lastName, gender, dateOfBirth.');
        }
        const dob = new Date(body.dateOfBirth);
        if (Number.isNaN(dob.getTime())) {
            throw new common_1.BadRequestException('dateOfBirth must be a valid ISO date string.');
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
};
exports.PatientsController = PatientsController;
__decorate([
    (0, common_1.Get)('branches/:branchId/patients'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "listPatients", null);
__decorate([
    (0, common_1.Post)('branches/:branchId/patients'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PatientsController.prototype, "createPatient", null);
exports.PatientsController = PatientsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientsController);
//# sourceMappingURL=patients.controller.js.map