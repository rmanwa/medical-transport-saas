import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
export declare class HospitalsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(req: RequestWithUser): Promise<{
        id: string;
        name: string;
        address: string;
        companyId: string;
    }[]>;
}
