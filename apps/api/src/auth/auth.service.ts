import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async login(email: string, password: string): Promise<{ accessToken: string } | null> {
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

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
    });

    return { accessToken };
  }
}