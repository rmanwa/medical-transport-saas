import { PrismaService } from '../prisma/prisma.service';
import type { RequestWithUser } from '../common/types/request-with-user';
export declare class MeController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getMe(req: RequestWithUser): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("@prisma/client").$Enums.Role;
            companyId: string;
            canAccessAllBranches: boolean;
            mustChangePassword: boolean;
            branchIds: string[];
        };
    }>;
}
