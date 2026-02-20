import { MeetingType, Priority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
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
    constructor(prisma: PrismaService);
    createShift(branchId: string, body: CreateShiftBody, req: RequestWithUser): Promise<{
        id: string;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
        hospitalId: string | null;
    }>;
}
export {};
