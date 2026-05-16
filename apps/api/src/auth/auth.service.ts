import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const smtpEnabled = this.email.isConfigured();
    const verificationToken = smtpEnabled ? randomBytes(32).toString('hex') : null;
    const verificationExpires = smtpEnabled ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        planTier: PlanTier.PREMIUM,
        emailVerified: !smtpEnabled,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
      select: {
        id: true,
        email: true,
        name: true,
        planTier: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (smtpEnabled && verificationToken) {
      const sent = await this.email.sendVerificationEmail(dto.email, dto.name ?? null, verificationToken);
      if (!sent.success) {
        await this.prisma.user.delete({ where: { id: user.id } });
        throw new ServiceUnavailableException(
          sent.error ||
            'Could not send verification email. Check SMTP_USER and SMTP_PASS (Gmail App Password) in .env.',
        );
      }
      return {
        requiresVerification: true,
        message: 'Please check your email to verify your account before signing in.',
        email: user.email,
      };
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired verification link');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: PlanTier.PREMIUM,
        emailVerified: true,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return { message: 'If that account exists and is unverified, we sent a new link.' };
    }
    if (!this.email.isConfigured()) {
      throw new ServiceUnavailableException('Email is not configured on this server');
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationExpires: expires },
    });

    await this.email.sendVerificationEmail(user.email, user.name, token);
    return { message: 'If that account exists and is unverified, we sent a new link.' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const generic = {
      message: 'If an account exists for that email, we sent password reset instructions.',
    };
    if (!user) return generic;
    if (!this.email.isConfigured()) {
      throw new ServiceUnavailableException('Email is not configured on this server');
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expires },
    });

    await this.email.sendPasswordResetEmail(user.email, user.name, token);
    return generic;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        emailVerified: true,
      },
    });

    return { message: 'Password updated. You can sign in with your new password.' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    if (this.email.isConfigured() && !user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before signing in. Check your inbox or request a new link.',
      );
    }

    await this.ensurePremium(user.id);

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: PlanTier.PREMIUM,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && this.email.isConfigured() && !user.emailVerified) {
        throw new UnauthorizedException('Email not verified');
      }
      const tokens = await this.issueTokens(payload.sub, payload.email);
      await this.ensurePremium(payload.sub);
      const fresh = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, planTier: true, emailVerified: true, createdAt: true },
      });
      return {
        user: fresh ? { ...fresh, planTier: PlanTier.PREMIUM } : fresh,
        ...tokens,
      };
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async ensurePremium(userId: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, planTier: PlanTier.FREE },
      data: { planTier: PlanTier.PREMIUM },
    });
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    return { accessToken, refreshToken };
  }
}
