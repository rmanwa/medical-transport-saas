import { HospitalsService } from './hospitals.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
export declare class HospitalsController {
    private readonly hospitals;
    constructor(hospitals: HospitalsService);
    list(req: any): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }[]>;
    create(req: any, dto: CreateHospitalDto): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }>;
    update(req: any, id: string, dto: UpdateHospitalDto): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
