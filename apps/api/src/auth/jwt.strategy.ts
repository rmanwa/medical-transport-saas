import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-me',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, companyId: payload.companyId },
      include: { branches: true },
    });

    if (!user) throw new UnauthorizedException('Invalid token');

    const branchIds = user.branches.map((ub) => ub.branchId);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      canAccessAllBranches: user.role === 'SUPER_ADMIN',
      branchIds,
    };
  }
}
