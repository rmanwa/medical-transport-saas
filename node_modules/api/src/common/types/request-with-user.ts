import type { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'STAFF';
  companyId: string;
  canAccessAllBranches: boolean;
  branchIds: string[];
};

export type RequestWithUser = Request & { user: AuthUser };
