import * as bcrypt from 'bcryptjs';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffBranchesDto } from './dto/update-staff-branches.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,   // ← NEW
    private readonly emailService: EmailService,    // ← NEW
  ) {}

  // ─── List all staff in the company ────────────────────────────────────

  async list(companyId: string) {
    const users = await this.prisma.user.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      canAccessAllBranches: u.canAccessAllBranches,
      branches: u.branches.map((ub) => ub.branch),
    }));
  }

  // ─── Get single staff member ──────────────────────────────────────────

  async getOne(companyId: string, staffId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: staffId, companyId },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) throw new NotFoundException('Staff member not found');

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      canAccessAllBranches: user.canAccessAllBranches,
      branches: user.branches.map((ub) => ub.branch),
    };
  }

  // ─── Invite (create) a new staff member ───────────────────────────────

  async invite(companyId: string, dto: InviteStaffDto, adminUserId: string) {  // ← adminUserId added
    const name = (dto.name ?? '').trim();
    const email = (dto.email ?? '').trim().toLowerCase();
    const password = dto.password ?? '';
    const branchIds = dto.branchIds ?? [];

    // Validate
    if (!name) throw new BadRequestException('name is required');
    if (!email || !email.includes('@'))
      throw new BadRequestException('A valid email is required');
    if (password.length < 6)
      throw new BadRequestException('password must be at least 6 characters');
    if (!Array.isArray(branchIds) || branchIds.length === 0)
      throw new BadRequestException('At least one branchId is required');

    // Check duplicate email
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    // Verify all branches belong to this company
    const validBranches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds }, companyId },
      select: { id: true },
    });
    const validIds = new Set(validBranches.map((b) => b.id));
    const invalidIds = branchIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid branch IDs: ${invalidIds.join(', ')}`,
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + branch links in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          name,
          role: 'STAFF',
          companyId,
          canAccessAllBranches: false,
          mustChangePassword: true, // ← force password change on first login
        },
      });

      await tx.userBranch.createMany({
        data: branchIds.map((branchId) => ({
          userId: newUser.id,
          branchId,
        })),
      });

      return newUser;
    });

    // ── Audit log ──
    await this.auditService.log({
      action: 'STAFF_INVITED',
      entityId: user.id,
      entityType: 'User',
      details: { staffName: name, staffEmail: email, branchIds },
      userId: adminUserId,
      companyId,
    });

    // ── Email temp password to the new staff member ──
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      await this.emailService.sendStaffInvite(
        email,
        name,
        password,                       // plain-text temp password (before hashing)
        company?.name ?? 'Clinic',
      );
    } catch {
      // Don't fail the invite if email send fails
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branchIds,
    };
  }

  // ─── Update staff profile (name, email) ───────────────────────────────

  async update(companyId: string, staffId: string, dto: UpdateStaffDto, adminUserId: string) {  // ← adminUserId added
    const existing = await this.prisma.user.findFirst({
      where: { id: staffId, companyId },
    });
    if (!existing) throw new NotFoundException('Staff member not found');

    const data: { name?: string; email?: string } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('name cannot be empty');
      data.name = name;
    }

    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (!email || !email.includes('@'))
        throw new BadRequestException('A valid email is required');

      // Check uniqueness
      const dup = await this.prisma.user.findFirst({
        where: { email, id: { not: staffId } },
      });
      if (dup) throw new ConflictException('Email already in use');
      data.email = email;
    }

    const updated = await this.prisma.user.update({
      where: { id: staffId },
      data,
    });

    // ── Audit log ──
    await this.auditService.log({
      action: 'STAFF_UPDATED',
      entityId: staffId,
      entityType: 'User',
      details: {
        staffName: updated.name,
        updatedFields: Object.keys(data),
      },
      userId: adminUserId,
      companyId,
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
    };
  }

  // ─── Update branch assignments ────────────────────────────────────────

  async updateBranches(
    companyId: string,
    staffId: string,
    dto: UpdateStaffBranchesDto,
    adminUserId: string,  // ← added
  ) {
    const branchIds = dto.branchIds ?? [];

    // Verify user exists in this company
    const user = await this.prisma.user.findFirst({
      where: { id: staffId, companyId },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    if (!Array.isArray(branchIds) || branchIds.length === 0) {
      throw new BadRequestException('At least one branchId is required');
    }

    // Verify all branches belong to this company
    const validBranches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds }, companyId },
      select: { id: true },
    });
    const validIds = new Set(validBranches.map((b) => b.id));
    const invalidIds = branchIds.filter((id) => !validIds.has(id));
    if (invalidIds.length > 0) {
      throw new BadRequestException(
        `Invalid branch IDs: ${invalidIds.join(', ')}`,
      );
    }

    // Replace all branch links in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Remove existing links
      await tx.userBranch.deleteMany({ where: { userId: staffId } });

      // Create new links
      await tx.userBranch.createMany({
        data: branchIds.map((branchId) => ({
          userId: staffId,
          branchId,
        })),
      });
    });

    // ── Audit log ──
    await this.auditService.log({
      action: 'STAFF_UPDATED',
      entityId: staffId,
      entityType: 'User',
      details: {
        staffName: user.name,
        action: 'branches_reassigned',
        branchIds,
      },
      userId: adminUserId,
      companyId,
    });

    return { ok: true, branchIds };
  }

  // ─── Remove a staff member ────────────────────────────────────────────

  async remove(companyId: string, staffId: string, adminUserId: string) {  // ← adminUserId added
    const user = await this.prisma.user.findFirst({
      where: { id: staffId, companyId },
    });
    if (!user) throw new NotFoundException('Staff member not found');

    if (user.role === 'SUPER_ADMIN') {
      // Prevent deleting the last admin
      const adminCount = await this.prisma.user.count({
        where: { companyId, role: 'SUPER_ADMIN' },
      });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last SUPER_ADMIN. Promote another user first.',
        );
      }
    }

    // Remove branch links first, then the user
    await this.prisma.$transaction(async (tx) => {
      await tx.userBranch.deleteMany({ where: { userId: staffId } });
      await tx.user.delete({ where: { id: staffId } });
    });

    // ── Audit log ──
    await this.auditService.log({
      action: 'STAFF_DELETED',
      entityId: staffId,
      entityType: 'User',
      details: { staffName: user.name, staffEmail: user.email },
      userId: adminUserId,
      companyId,
    });

    return { ok: true };
  }
}