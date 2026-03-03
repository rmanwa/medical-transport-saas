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
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const staff_service_1 = require("./staff.service");
const invite_staff_dto_1 = require("./dto/invite-staff.dto");
const update_staff_dto_1 = require("./dto/update-staff.dto");
const update_staff_branches_dto_1 = require("./dto/update-staff-branches.dto");
function requireAdmin(user) {
    if (user.role !== 'SUPER_ADMIN')
        throw new common_1.ForbiddenException('Admin only');
}
let StaffController = class StaffController {
    staff;
    constructor(staff) {
        this.staff = staff;
    }
    async list(req) {
        const user = req.user;
        requireAdmin(user);
        return this.staff.list(user.companyId);
    }
    async getOne(req, id) {
        const user = req.user;
        requireAdmin(user);
        return this.staff.getOne(user.companyId, id);
    }
    async invite(req, dto) {
        const user = req.user;
        requireAdmin(user);
        return this.staff.invite(user.companyId, dto, user.id);
    }
    async update(req, id, dto) {
        const user = req.user;
        requireAdmin(user);
        return this.staff.update(user.companyId, id, dto, user.id);
    }
    async updateBranches(req, id, dto) {
        const user = req.user;
        requireAdmin(user);
        return this.staff.updateBranches(user.companyId, id, dto, user.id);
    }
    async remove(req, id) {
        const user = req.user;
        requireAdmin(user);
        if (user.id === id) {
            throw new common_1.ForbiddenException('You cannot delete your own account');
        }
        return this.staff.remove(user.companyId, id, user.id);
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)('invite'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, invite_staff_dto_1.InviteStaffDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "invite", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_staff_dto_1.UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/branches'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_staff_branches_dto_1.UpdateStaffBranchesDto]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateBranches", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "remove", null);
exports.StaffController = StaffController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [staff_service_1.StaffService])
], StaffController);
//# sourceMappingURL=staff.controller.js.map