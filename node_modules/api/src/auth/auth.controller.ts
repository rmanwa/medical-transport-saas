import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

type Verify2FABody = {
  tempToken?: unknown;
  code?: unknown;
};

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

type Confirm2FABody = {
  code?: unknown;
};

type Disable2FABody = {
  password?: unknown;
};

type ForgotPasswordBody = {
  email?: unknown;
};

type ResetPasswordBody = {
  email?: unknown;
  code?: unknown;
  newPassword?: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ─── Login ────────────────────────────────────────────────────────────────

  @Post('login')
  async login(@Body() body: LoginBody) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !email.includes('@') || !password) {
      throw new BadRequestException('email and password are required');
    }

    const result = await this.auth.login(email, password);
    if (!result) throw new UnauthorizedException('Invalid credentials');
    return result; // { accessToken } or { requires2FA: true, tempToken: '...' }
  }

  // ─── Verify 2FA code during login ─────────────────────────────────────────

  @Post('2fa/verify')
  async verify2FA(@Body() body: Verify2FABody) {
    const tempToken = typeof body.tempToken === 'string' ? body.tempToken : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!tempToken || !code) {
      throw new BadRequestException('tempToken and code are required');
    }

    if (!/^\d{6}$/.test(code)) {
      throw new BadRequestException('code must be a 6-digit number');
    }

    const result = await this.auth.verify2FA(tempToken, code);
    if (!result) throw new UnauthorizedException('Invalid or expired 2FA code');
    return result; // { accessToken }
  }

  // ─── 2FA Setup (generate QR code) ────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setup2FA(@Req() req: any) {
    const userId = req.user.id as string;
    const result = await this.auth.setup2FA(userId);
    if (!result) throw new BadRequestException('2FA is already enabled or user not found');
    return result; // { qrCodeDataUrl, secret }
  }

  // ─── 2FA Confirm (activate with code) ────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('2fa/confirm')
  async confirm2FA(@Req() req: any, @Body() body: Confirm2FABody) {
    const userId = req.user.id as string;
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!code || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('A valid 6-digit code is required');
    }

    const ok = await this.auth.confirm2FA(userId, code);
    if (!ok) throw new BadRequestException('Invalid code. Please try again.');
    return { ok: true, message: '2FA has been enabled successfully' };
  }

  // ─── 2FA Disable ──────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Delete('2fa')
  async disable2FA(@Req() req: any, @Body() body: Disable2FABody) {
    const userId = req.user.id as string;
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      throw new BadRequestException('Password is required to disable 2FA');
    }

    const ok = await this.auth.disable2FA(userId, password);
    if (!ok) throw new UnauthorizedException('Incorrect password');
    return { ok: true, message: '2FA has been disabled' };
  }

  // ─── 2FA Status ───────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async get2FAStatus(@Req() req: any) {
    const userId = req.user.id as string;
    return this.auth.get2FAStatus(userId);
  }

  // ─── Change Password ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(@Req() req: any, @Body() body: ChangePasswordBody) {
    const userId = req.user.id as string;
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword) {
      throw new BadRequestException('currentPassword is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'newPassword is required and must be at least 6 characters',
      );
    }

    const ok = await this.auth.changePassword(userId, currentPassword, newPassword);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');
    return { ok: true };
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────

  @Post('forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordBody) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }

    await this.auth.forgotPassword(email);

    // Always return success to prevent email enumeration
    return { ok: true, message: 'If an account exists with that email, a reset code has been sent.' };
  }

  // ─── Reset Password ──────────────────────────────────────────────────────

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordBody) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!email || !email.includes('@')) {
      throw new BadRequestException('A valid email is required');
    }
    if (!code || !/^\d{6}$/.test(code)) {
      throw new BadRequestException('A valid 6-digit code is required');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('New password must be at least 6 characters');
    }

    const ok = await this.auth.resetPassword(email, code, newPassword);
    if (!ok) throw new BadRequestException('Invalid or expired reset code');
    return { ok: true, message: 'Password has been reset successfully' };
  }
}