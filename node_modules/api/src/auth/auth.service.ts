import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string): Promise<{ accessToken: string } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { branches: true },
    });
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;

    const payload = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    };

    return { accessToken: await this.jwt.signAsync(payload) };
  }
}
