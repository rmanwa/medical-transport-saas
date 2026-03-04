import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffBranchesDto } from './dto/update-staff-branches.dto';
export declare class StaffController {
    private readonly staff;
    constructor(staff: StaffService);
    list(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        canAccessAllBranches: boolean;
        branches: {
            id: string;
            name: string;
        }[];
    }[]>;
    getOne(req: any, id: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        canAccessAllBranches: boolean;
        branches: {
            id: string;
            name: string;
        }[];
    }>;
    invite(req: any, dto: InviteStaffDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        branchIds: string[];
    }>;
    update(req: any, id: string, dto: UpdateStaffDto): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    updateBranches(req: any, id: string, dto: UpdateStaffBranchesDto): Promise<{
        ok: boolean;
        branchIds: string[];
    }>;
    remove(req: any, id: string): Promise<{
        ok: boolean;
    }>;
}
