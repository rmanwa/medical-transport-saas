import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../types/auth-user';

export async function assertBranchAccess(
  prisma: PrismaService,
  user: AuthUser,
  branchId: string,
) {
  // Ensure branch belongs to same company (prevents cross-tenant access)
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, companyId: user.companyId },
    select: { id: true },
  });

  if (!branch) {
    throw new NotFoundException('Branch not found.');
  }

  // SUPER_ADMIN can access all branches in company
  if (user.role === 'SUPER_ADMIN') return;

  // Floater staff can access all branches in company
  if (user.canAccessAllBranches) return;

  // Normal staff must be explicitly assigned via UserBranch
  if (!user.branchIds.includes(branchId)) {
    throw new ForbiddenException('Not authorized for this branch.');
  }
}
