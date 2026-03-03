import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
export interface AuditLogInput {
    action: AuditAction;
    entityId: string;
    entityType: string;
    details?: Record<string, any>;
    userId: string;
    companyId: string;
}
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(input: AuditLogInput): Promise<{
        id: string;
        companyId: string;
        userId: string;
        action: import("@prisma/client").$Enums.AuditAction;
        entityId: string;
        entityType: string;
        details: Prisma.JsonValue | null;
        createdAt: Date;
    }>;
    findAll(companyId: string, filters: {
        action?: AuditAction;
        userId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            companyId: string;
            userId: string;
            action: import("@prisma/client").$Enums.AuditAction;
            entityId: string;
            entityType: string;
            details: Prisma.JsonValue | null;
            createdAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
