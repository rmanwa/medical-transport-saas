import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const token = await this.auth.login(body.email, body.password);
    if (!token) throw new UnauthorizedException('Invalid credentials');
    return token; // { accessToken }
  }
}
