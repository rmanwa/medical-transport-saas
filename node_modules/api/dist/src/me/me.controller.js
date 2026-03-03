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
exports.MeController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let MeController = class MeController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMe(req) {
        const userId = req.user.id;
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                companyId: true,
                canAccessAllBranches: true,
                mustChangePassword: true,
                branches: {
                    select: { branchId: true },
                },
            },
        });
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                companyId: user.companyId,
                canAccessAllBranches: user.canAccessAllBranches,
                mustChangePassword: user.mustChangePassword,
                branchIds: user.branches.map((ub) => ub.branchId),
            },
        };
    }
};
exports.MeController = MeController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "getMe", null);
exports.MeController = MeController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('me'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MeController);
//# sourceMappingURL=me.controller.js.map