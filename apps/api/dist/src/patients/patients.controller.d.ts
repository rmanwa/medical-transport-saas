import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { RequestWithUser } from '../common/types/request-with-user';
type CreatePatientBody = {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    email?: string;
};
type UpdatePatientBody = {
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
    email?: string;
};
export declare class PatientsController {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    listPatients(branchId: string, req: RequestWithUser): Promise<{
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: Date;
        branchId: string;
    }[]>;
    createPatient(branchId: string, body: CreatePatientBody, req: RequestWithUser): Promise<{
        branch: {
            id: string;
            name: string;
            companyId: string;
            address: string;
        };
    } & {
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: Date;
        branchId: string;
    }>;
    updatePatient(branchId: string, patientId: string, body: UpdatePatientBody, req: RequestWithUser): Promise<{
        id: string;
        email: string | null;
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: Date;
        branchId: string;
    }>;
    deletePatient(branchId: string, patientId: string, req: RequestWithUser): Promise<{
        ok: boolean;
    }>;
}
export {};
