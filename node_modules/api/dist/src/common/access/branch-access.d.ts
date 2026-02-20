import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user';
export declare function assertBranchAccess(prisma: PrismaService, user: AuthUser, branchId: string): Promise<void>;
