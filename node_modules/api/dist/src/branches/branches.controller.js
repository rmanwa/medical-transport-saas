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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
let BranchesController = class BranchesController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(req) {
        const user = req.user;
        if (user.role === 'SUPER_ADMIN' || user.canAccessAllBranches) {
            return this.prisma.branch.findMany({
                where: { companyId: user.companyId },
                orderBy: { name: 'asc' },
            });
        }
        return this.prisma.branch.findMany({
            where: { id: { in: user.branchIds }, companyId: user.companyId },
            orderBy: { name: 'asc' },
        });
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BranchesController.prototype, "list", null);
exports.BranchesController = BranchesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('branches'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map