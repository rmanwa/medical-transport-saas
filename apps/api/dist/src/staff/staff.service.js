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
exports.StaffService = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StaffService = class StaffService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        const users = await this.prisma.user.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
            include: {
                branches: {
                    include: { branch: { select: { id: true, name: true } } },
                },
            },
        });
        return users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            canAccessAllBranches: u.canAccessAllBranches,
            branches: u.branches.map((ub) => ub.branch),
        }));
    }
    async getOne(companyId, staffId) {
        const user = await this.prisma.user.findFirst({
            where: { id: staffId, companyId },
            include: {
                branches: {
                    include: { branch: { select: { id: true, name: true } } },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('Staff member not found');
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            canAccessAllBranches: user.canAccessAllBranches,
            branches: user.branches.map((ub) => ub.branch),
        };
    }
    async invite(companyId, dto) {
        const name = (dto.name ?? '').trim();
        const email = (dto.email ?? '').trim().toLowerCase();
        const password = dto.password ?? '';
        const branchIds = dto.branchIds ?? [];
        if (!name)
            throw new common_1.BadRequestException('name is required');
        if (!email || !email.includes('@'))
            throw new common_1.BadRequestException('A valid email is required');
        if (password.length < 6)
            throw new common_1.BadRequestException('password must be at least 6 characters');
        if (!Array.isArray(branchIds) || branchIds.length === 0)
            throw new common_1.BadRequestException('At least one branchId is required');
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const validBranches = await this.prisma.branch.findMany({
            where: { id: { in: branchIds }, companyId },
            select: { id: true },
        });
        const validIds = new Set(validBranches.map((b) => b.id));
        const invalidIds = branchIds.filter((id) => !validIds.has(id));
        if (invalidIds.length > 0) {
            throw new common_1.BadRequestException(`Invalid branch IDs: ${invalidIds.join(', ')}`);
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    name,
                    role: 'STAFF',
                    companyId,
                    canAccessAllBranches: false,
                    mustChangePassword: true,
                },
            });
            await tx.userBranch.createMany({
                data: branchIds.map((branchId) => ({
                    userId: newUser.id,
                    branchId,
                })),
            });
            return newUser;
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            branchIds,
        };
    }
    async update(companyId, staffId, dto) {
        const existing = await this.prisma.user.findFirst({
            where: { id: staffId, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('Staff member not found');
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name)
                throw new common_1.BadRequestException('name cannot be empty');
            data.name = name;
        }
        if (dto.email !== undefined) {
            const email = dto.email.trim().toLowerCase();
            if (!email || !email.includes('@'))
                throw new common_1.BadRequestException('A valid email is required');
            const dup = await this.prisma.user.findFirst({
                where: { email, id: { not: staffId } },
            });
            if (dup)
                throw new common_1.ConflictException('Email already in use');
            data.email = email;
        }
        const updated = await this.prisma.user.update({
            where: { id: staffId },
            data,
        });
        return {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
        };
    }
    async updateBranches(companyId, staffId, dto) {
        const branchIds = dto.branchIds ?? [];
        const user = await this.prisma.user.findFirst({
            where: { id: staffId, companyId },
        });
        if (!user)
            throw new common_1.NotFoundException('Staff member not found');
        if (!Array.isArray(branchIds) || branchIds.length === 0) {
            throw new common_1.BadRequestException('At least one branchId is required');
        }
        const validBranches = await this.prisma.branch.findMany({
            where: { id: { in: branchIds }, companyId },
            select: { id: true },
        });
        const validIds = new Set(validBranches.map((b) => b.id));
        const invalidIds = branchIds.filter((id) => !validIds.has(id));
        if (invalidIds.length > 0) {
            throw new common_1.BadRequestException(`Invalid branch IDs: ${invalidIds.join(', ')}`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.userBranch.deleteMany({ where: { userId: staffId } });
            await tx.userBranch.createMany({
                data: branchIds.map((branchId) => ({
                    userId: staffId,
                    branchId,
                })),
            });
        });
        return { ok: true, branchIds };
    }
    async remove(companyId, staffId) {
        const user = await this.prisma.user.findFirst({
            where: { id: staffId, companyId },
        });
        if (!user)
            throw new common_1.NotFoundException('Staff member not found');
        if (user.role === 'SUPER_ADMIN') {
            const adminCount = await this.prisma.user.count({
                where: { companyId, role: 'SUPER_ADMIN' },
            });
            if (adminCount <= 1) {
                throw new common_1.BadRequestException('Cannot remove the last SUPER_ADMIN. Promote another user first.');
            }
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.userBranch.deleteMany({ where: { userId: staffId } });
            await tx.user.delete({ where: { id: staffId } });
        });
        return { ok: true };
    }
};
exports.StaffService = StaffService;
exports.StaffService = StaffService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StaffService);
//# sourceMappingURL=staff.service.js.map