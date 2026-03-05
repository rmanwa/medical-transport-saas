import { MeetingType, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import type { RequestWithUser } from '../common/types/request-with-user';
type CreateShiftBody = {
    patientId: string;
    startTime: string;
    endTime: string;
    notes?: string;
    type?: MeetingType;
    priority?: Priority;
    hospitalId?: string | null;
};
export declare class ShiftsController {
    private readonly prisma;
    private readonly auditService;
    private readonly emailService;
    constructor(prisma: PrismaService, auditService: AuditService, emailService: EmailService);
    createShift(branchId: string, body: CreateShiftBody, req: RequestWithUser): Promise<{
        branch: {
            id: string;
            name: string;
            companyId: string;
            address: string;
        };
    } & {
        id: string;
        branchId: string;
        hospitalId: string | null;
        patientId: string;
        priority: import("@prisma/client").$Enums.Priority;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
    }>;
}
export {};
