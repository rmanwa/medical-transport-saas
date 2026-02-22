import { BadRequestException, Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

type LoginBody = {
  email?: unknown;
  password?: unknown;
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
}