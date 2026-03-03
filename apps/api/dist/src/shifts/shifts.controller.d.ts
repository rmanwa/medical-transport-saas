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
            name: string;
            id: string;
            address: string;
            companyId: string;
        };
    } & {
        priority: import("@prisma/client").$Enums.Priority;
        branchId: string;
        id: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        patientId: string;
        hospitalId: string | null;
    }>;
}
export {};
