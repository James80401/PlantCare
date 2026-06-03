import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccountApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { effectivePlanTier } from '../config/premium-policy';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private email: EmailService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        planTier: true,
        name: true,
        emailVerified: true,
        accountApprovalStatus: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    if (this.email.isConfigured() && !user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    if (user.accountApprovalStatus === AccountApprovalStatus.REJECTED) {
      throw new UnauthorizedException('Account not approved');
    }
    if (user.accountApprovalStatus === AccountApprovalStatus.PENDING) {
      throw new UnauthorizedException('Account awaiting admin approval');
    }
    return { sub: user.id, email: user.email, planTier: effectivePlanTier(this.config, user.planTier), name: user.name };
  }
}
