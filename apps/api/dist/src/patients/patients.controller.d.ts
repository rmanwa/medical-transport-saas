import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
type CreatePatientBody = {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
};
export declare class PatientsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPatients(branchId: string, req: RequestWithUser): Promise<{
        id: string;
        branchId: string;
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: Date;
    }[]>;
    createPatient(branchId: string, body: CreatePatientBody, req: RequestWithUser): Promise<{
        id: string;
        branchId: string;
        firstName: string;
        lastName: string;
        gender: string;
        dateOfBirth: Date;
    }>;
}
export {};
