"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupService = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let SetupService = class SetupService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async needsSetup() {
        const adminCount = await this.prisma.user.count({
            where: { role: 'SUPER_ADMIN' },
        });
        return adminCount === 0;
    }
    async performSetup(dto) {
        const setupNeeded = await this.needsSetup();
        if (!setupNeeded) {
            throw new common_1.ConflictException('Setup has already been completed');
        }
        const adminName = (dto.adminName ?? '').trim();
        const adminEmail = (dto.adminEmail ?? '').trim().toLowerCase();
        const adminPassword = dto.adminPassword ?? '';
        const companyName = (dto.companyName ?? '').trim();
        const branchName = (dto.branchName ?? '').trim();
        const branchAddress = (dto.branchAddress ?? '').trim();
        if (!adminName)
            throw new common_1.BadRequestException('adminName is required');
        if (!adminEmail || !adminEmail.includes('@'))
            throw new common_1.BadRequestException('A valid adminEmail is required');
        if (adminPassword.length < 6)
            throw new common_1.BadRequestException('adminPassword must be at least 6 characters');
        if (!companyName)
            throw new common_1.BadRequestException('companyName is required');
        if (!branchName)
            throw new common_1.BadRequestException('branchName is required');
        if (!branchAddress)
            throw new common_1.BadRequestException('branchAddress is required');
        const existingUser = await this.prisma.user.findUnique({
            where: { email: adminEmail },
        });
        if (existingUser)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        const result = await this.prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: { name: companyName },
            });
            const branch = await tx.branch.create({
                data: {
                    name: branchName,
                    address: branchAddress,
                    companyId: company.id,
                },
            });
            const user = await tx.user.create({
                data: {
                    email: adminEmail,
                    passwordHash,
                    name: adminName,
                    role: 'SUPER_ADMIN',
                    companyId: company.id,
                    canAccessAllBranches: true,
                },
            });
            await tx.userBranch.create({
                data: {
                    userId: user.id,
                    branchId: branch.id,
                },
            });
            return { user, company, branch };
        });
        const accessToken = await this.jwt.signAsync({
            sub: result.user.id,
            companyId: result.user.companyId,
            role: result.user.role,
        });
        return { accessToken };
    }
};
exports.SetupService = SetupService;
exports.SetupService = SetupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], SetupService);
//# sourceMappingURL=setup.service.js.map