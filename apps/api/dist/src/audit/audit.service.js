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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AuditService = class AuditService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(input) {
        return this.prisma.auditLog.create({
            data: {
                action: input.action,
                entityId: input.entityId,
                entityType: input.entityType,
                details: input.details
                    ? input.details
                    : client_1.Prisma.DbNull,
                userId: input.userId,
                companyId: input.companyId,
            },
        });
    }
    async findAll(companyId, filters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 30;
        const skip = (page - 1) * limit;
        const where = { companyId };
        if (filters.action) {
            where.action = filters.action;
        }
        if (filters.userId) {
            where.userId = filters.userId;
        }
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.createdAt.lte = new Date(filters.endDate);
        }
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map