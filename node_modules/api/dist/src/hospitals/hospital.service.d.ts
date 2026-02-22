import { PrismaService } from '../prisma/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
export declare class HospitalsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId: string): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }[]>;
    create(companyId: string, dto: CreateHospitalDto): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }>;
    update(companyId: string, hospitalId: string, dto: UpdateHospitalDto): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }>;
    remove(companyId: string, hospitalId: string): Promise<{
        ok: boolean;
    }>;
}
