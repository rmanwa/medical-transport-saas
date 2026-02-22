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
exports.HospitalsController = void 0;
const common_1 = require("@nestjs/common");
const hospitals_service_1 = require("./hospitals.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const create_hospital_dto_1 = require("./dto/create-hospital.dto");
const update_hospital_dto_1 = require("./dto/update-hospital.dto");
let HospitalsController = class HospitalsController {
    hospitals;
    constructor(hospitals) {
        this.hospitals = hospitals;
    }
    async list(req) {
        const user = req.user;
        return this.hospitals.list(user.companyId);
    }
    async create(req, dto) {
        const user = req.user;
        if (user.role !== 'SUPER_ADMIN')
            throw new common_1.ForbiddenException('Managers only');
        return this.hospitals.create(user.companyId, dto);
    }
    async update(req, id, dto) {
        const user = req.user;
        if (user.role !== 'SUPER_ADMIN')
            throw new common_1.ForbiddenException('Managers only');
        return this.hospitals.update(user.companyId, id, dto);
    }
    async remove(req, id) {
        const user = req.user;
        if (user.role !== 'SUPER_ADMIN')
            throw new common_1.ForbiddenException('Managers only');
        return this.hospitals.remove(user.companyId, id);
    }
};
exports.HospitalsController = HospitalsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_hospital_dto_1.CreateHospitalDto]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_hospital_dto_1.UpdateHospitalDto]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], HospitalsController.prototype, "remove", null);
exports.HospitalsController = HospitalsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('hospitals'),
    __metadata("design:paramtypes", [hospitals_service_1.HospitalsService])
], HospitalsController);
//# sourceMappingURL=hospitals.controller.js.map