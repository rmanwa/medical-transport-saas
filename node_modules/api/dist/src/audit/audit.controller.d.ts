import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';
import type { RequestWithUser } from '../common/types/request-with-user';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getAuditLogs(req: RequestWithUser, action?: AuditAction, userId?: string, startDate?: string, endDate?: string, page?: string, limit?: string): Promise<{
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
            details: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
