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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const dashboard_service_1 = require("./dashboard.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let DashboardController = class DashboardController {
    dashboard;
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    async companyOverview(req) {
        return this.dashboard.getCompanyOverview(req.user);
    }
    async branchesOverview(req) {
        return this.dashboard.getBranchesOverview(req.user);
    }
    async branchDrilldown(branchId, req) {
        const result = await this.dashboard.getBranchDrilldown(req.user, branchId);
        if (!result)
            throw new common_1.NotFoundException('Branch not found or not authorized.');
        return result;
    }
    async todaySchedule(req, branchId) {
        return this.dashboard.getTodaySchedule(req.user, branchId);
    }
    async urgentQueue(req, branchId) {
        return this.dashboard.getUrgentQueue(req.user, branchId);
    }
    async topHospitals(req, branchId) {
        return this.dashboard.getTopHospitals(req.user, branchId);
    }
    async scheduleRange(req, from, to, branchId) {
        if (!from?.trim())
            throw new common_1.BadRequestException('from is required (ISO date string).');
        if (!to?.trim())
            throw new common_1.BadRequestException('to is required (ISO date string).');
        try {
            return await this.dashboard.getScheduleRange(req.user, from, to, branchId);
        }
        catch (e) {
            const code = e?.message;
            if (code === 'INVALID_FROM')
                throw new common_1.BadRequestException('from must be a valid ISO date string.');
            if (code === 'INVALID_TO')
                throw new common_1.BadRequestException('to must be a valid ISO date string.');
            if (code === 'INVALID_RANGE')
                throw new common_1.BadRequestException('to must be after from.');
            if (code === 'RANGE_TOO_LARGE')
                throw new common_1.BadRequestException('Range too large. Max is 31 days.');
            throw e;
        }
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "companyOverview", null);
__decorate([
    (0, common_1.Get)('branches'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "branchesOverview", null);
__decorate([
    (0, common_1.Get)('branches/:branchId'),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "branchDrilldown", null);
__decorate([
    (0, common_1.Get)('schedule/today'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "todaySchedule", null);
__decorate([
    (0, common_1.Get)('queue/urgent'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "urgentQueue", null);
__decorate([
    (0, common_1.Get)('top/hospitals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "topHospitals", null);
__decorate([
    (0, common_1.Get)('schedule/range'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('from')),
    __param(2, (0, common_1.Query)('to')),
    __param(3, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "scheduleRange", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('dashboard'),
    __metadata("design:paramtypes", [dashboard_service_1.DashboardService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map