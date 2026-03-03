import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffBranchesDto } from './dto/update-staff-branches.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffService {
    private readonly prisma;
    private readonly auditService;
    private readonly emailService;
    constructor(prisma: PrismaService, auditService: AuditService, emailService: EmailService);
    list(companyId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        canAccessAllBranches: boolean;
        branches: {
            name: string;
            id: string;
        }[];
    }[]>;
    getOne(companyId: string, staffId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        canAccessAllBranches: boolean;
        branches: {
            name: string;
            id: string;
        }[];
    }>;
    invite(companyId: string, dto: InviteStaffDto, adminUserId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        branchIds: string[];
    }>;
    update(companyId: string, staffId: string, dto: UpdateStaffDto, adminUserId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
    }>;
    updateBranches(companyId: string, staffId: string, dto: UpdateStaffBranchesDto, adminUserId: string): Promise<{
        ok: boolean;
        branchIds: string[];
    }>;
    remove(companyId: string, staffId: string, adminUserId: string): Promise<{
        ok: boolean;
    }>;
}
