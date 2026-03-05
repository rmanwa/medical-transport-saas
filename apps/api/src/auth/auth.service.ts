import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ─── Login (with 2FA support) ─────────────────────────────────────────────

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string } | { requires2FA: true; tempToken: string } | null> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    const rawPassword = password ?? '';

    if (!normalizedEmail || !rawPassword) return null;

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { branches: true },
    });

    if (!user) return null;

    const ok = await bcrypt.compare(rawPassword, user.passwordHash);
    if (!ok) return null;

    // If 2FA is enabled, return a temporary token instead of the real one
    if (user.twoFactorEnabled) {
      const tempToken = await this.jwt.signAsync(
        { sub: user.id, purpose: '2fa-pending' },
        { expiresIn: '5m' },
      );
      return { requires2FA: true, tempToken };
    }

    // No 2FA — issue full access token
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return { accessToken };
  }

  // ─── Verify 2FA code during login ─────────────────────────────────────────

  async verify2FA(
    tempToken: string,
    code: string,
  ): Promise<{ accessToken: string } | null> {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(tempToken);
    } catch {
      return null;
    }

    if (payload.purpose !== '2fa-pending') return null;

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return null;

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) return null;

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return { accessToken };
  }

  // ─── 2FA Setup (generate secret + QR code) ───────────────────────────────

  async setup2FA(userId: string): Promise<{ qrCodeDataUrl: string; secret: string } | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    if (user.twoFactorEnabled) return null; // Already enabled

    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email, 'ClinicDashboard', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    // Store the secret (not yet enabled — user must confirm with a code first)
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { qrCodeDataUrl, secret };
  }

  // ─── 2FA Confirm (user enters code to activate) ──────────────────────────

  async confirm2FA(userId: string, code: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) return false;

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) return false;

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return true;
  }

  // ─── 2FA Disable ──────────────────────────────────────────────────────────

  async disable2FA(userId: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return false;

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return true;
  }

  // ─── Get 2FA status ───────────────────────────────────────────────────────

  async get2FAStatus(userId: string): Promise<{ enabled: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return { enabled: user?.twoFactorEnabled ?? false };
  }

  // ─── Change Password ─────────────────────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return false;

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return false;

    const newHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return true;
  }

  // ─── Forgot Password (send reset code via email) ─────────────────────────

  async forgotPassword(email: string): Promise<boolean> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail) return false;

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return true to prevent email enumeration
    if (!user) return true;

    // Generate a 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const codeHash = await bcrypt.hash(code, 10);

    // Invalidate previous unused resets for this user
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Store the hashed code with 15-minute expiry
    await this.prisma.passwordReset.create({
      data: {
        codeHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send email with the code
    try {
      await this.emailService.sendMail({
        to: user.email,
        subject: 'Password Reset Code',
        html: `
          <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1e293b; margin-bottom: 8px;">Password Reset</h2>
            <p style="color: #475569;">Hello ${user.name},</p>
            <p style="color: #475569;">You requested a password reset. Use the code below to reset your password:</p>
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin: 16px 0; text-align: center;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send password reset email', err);
    }

    return true;
  }

  // ─── Reset Password (verify code + set new password) ─────────────────────

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<boolean> {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail || !code || !newPassword) return false;

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) return false;

    // Find the latest unused, non-expired reset for this user
    const reset = await this.prisma.passwordReset.findFirst({
      where: {
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!reset) return false;

    const codeOk = await bcrypt.compare(code, reset.codeHash);
    if (!codeOk) return false;

    // Mark the reset as used
    await this.prisma.passwordReset.update({
      where: { id: reset.id },
      data: { used: true },
    });

    // Update password
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    return true;
  }
}