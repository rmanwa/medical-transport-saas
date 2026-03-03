import {
  BadRequestException,
  Body,
  Controller,
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

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginBody) {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !email.includes('@') || !password) {
      throw new BadRequestException('email and password are required');
    }

    const result = await this.auth.login(email, password);
    if (!result) throw new UnauthorizedException('Invalid credentials');
    return result; // { accessToken }
  }

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
}