import * as bcrypt from 'bcryptjs';
import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SetupDto } from './dto/setup.dto';

@Injectable()
export class SetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Returns true when the system has zero SUPER_ADMIN users,
   * meaning the first-launch setup wizard should be shown.
   */
  async needsSetup(): Promise<boolean> {
    const adminCount = await this.prisma.user.count({
      where: { role: 'SUPER_ADMIN' },
    });
    return adminCount === 0;
  }

  /**
   * Creates the first Company, Branch, and SUPER_ADMIN user in one transaction.
   * Returns a signed JWT so the admin is immediately logged in.
   */
  async performSetup(dto: SetupDto): Promise<{ accessToken: string }> {
    // ── Guard: only allow setup once ──────────────────────────────────────
    const setupNeeded = await this.needsSetup();
    if (!setupNeeded) {
      throw new ConflictException('Setup has already been completed');
    }

    // ── Validate inputs ──────────────────────────────────────────────────
    const adminName = (dto.adminName ?? '').trim();
    const adminEmail = (dto.adminEmail ?? '').trim().toLowerCase();
    const adminPassword = dto.adminPassword ?? '';
    const companyName = (dto.companyName ?? '').trim();
    const branchName = (dto.branchName ?? '').trim();
    const branchAddress = (dto.branchAddress ?? '').trim();

    if (!adminName) throw new BadRequestException('adminName is required');
    if (!adminEmail || !adminEmail.includes('@'))
      throw new BadRequestException('A valid adminEmail is required');
    if (adminPassword.length < 6)
      throw new BadRequestException('adminPassword must be at least 6 characters');
    if (!companyName) throw new BadRequestException('companyName is required');
    if (!branchName) throw new BadRequestException('branchName is required');
    if (!branchAddress) throw new BadRequestException('branchAddress is required');

    // ── Check for duplicate email ────────────────────────────────────────
    const existingUser = await this.prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (existingUser) throw new ConflictException('Email already registered');

    // ── Hash password ────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // ── Create everything in a single transaction ────────────────────────
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Company
      const company = await tx.company.create({
        data: { name: companyName },
      });

      // 2. First branch
      const branch = await tx.branch.create({
        data: {
          name: branchName,
          address: branchAddress,
          companyId: company.id,
        },
      });

      // 3. Admin user
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: 'SUPER_ADMIN',
          companyId: company.id,
          canAccessAllBranches: true,
        },
      });

      // 4. Link admin to the first branch
      await tx.userBranch.create({
        data: {
          userId: user.id,
          branchId: branch.id,
        },
      });

      return { user, company, branch };
    });

    // ── Sign JWT (matches auth.service.ts pattern) ───────────────────────
    const accessToken = await this.jwt.signAsync({
      sub: result.user.id,
      companyId: result.user.companyId,
      role: result.user.role,
    });

    return { accessToken };
  }
}