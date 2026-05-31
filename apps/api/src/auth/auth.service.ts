import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { AccountApprovalStatus, PlanTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  adminEmails,
  isAdminEmail,
  requiresAdminApproval,
} from '../config/registration-policy';
import { effectivePlanTier } from '../config/premium-policy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private email: EmailService,
  ) {}

  onModuleInit() {
    if (!requiresAdminApproval(this.config)) return;
    const admins = adminEmails(this.config);
    if (admins.length === 0) {
      this.logger.error(
        'Admin approval is enabled but ADMIN_EMAILS is empty — set admin emails in .env.production',
      );
      return;
    }
    this.logger.log(`Registration requires admin approval (admins: ${admins.join(', ')})`);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const smtpEnabled = this.email.isConfigured();
    const approvalRequired = requiresAdminApproval(this.config);
    const autoApprove = !approvalRequired || isAdminEmail(this.config, dto.email);
    const verificationToken = smtpEnabled ? randomBytes(32).toString('hex') : null;
    const verificationExpires = smtpEnabled ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        planTier: PlanTier.FREE,
        emailVerified: !smtpEnabled,
        accountApprovalStatus: autoApprove
          ? AccountApprovalStatus.APPROVED
          : AccountApprovalStatus.PENDING,
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
        message: approvalRequired
          ? 'Check your email to verify your account. After verification, an admin must approve your account before you can sign in.'
          : 'Please check your email to verify your account before signing in.',
        email: user.email,
      };
    }

    if (!autoApprove) {
      return {
        requiresAdminApproval: true,
        message:
          'Your account was created and is awaiting admin approval. You will receive an email when you can sign in.',
        email: user.email,
      };
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return { user: { ...user, planTier: effectivePlanTier(this.config, user.planTier) }, ...tokens };
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

    if (user.accountApprovalStatus === AccountApprovalStatus.PENDING) {
      await this.notifyAdminsOfPendingRegistration(user.email, user.name);
      return {
        message:
          'Email verified. Your account is awaiting admin approval. You will receive an email when you can sign in.',
        requiresAdminApproval: true,
        email: user.email,
      };
    }

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier: effectivePlanTier(this.config, user.planTier),
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

    const sent = await this.email.sendVerificationEmail(user.email, user.name, token);
    if (!sent.success) {
      throw new ServiceUnavailableException(
        sent.error ||
          'Could not send verification email. Check SMTP settings or try again later.',
      );
    }
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

    const sent = await this.email.sendPasswordResetEmail(user.email, user.name, token);
    if (!sent.success) {
      const base = this.config.get<string>('FRONTEND_URL', 'http://localhost:5173').replace(/\/$/, '');
      const devUrl = `${base}/reset-password/${token}`;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Password reset email failed; local reset link: ${devUrl}`);
      }
      throw new ServiceUnavailableException(
        sent.error ||
          'Could not send password reset email. Check SMTP_USER and SMTP_PASS (Gmail App Password) in server .env.',
      );
    }
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
    await this.revokeAllForUser(user.id);

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

    if (user.accountApprovalStatus === AccountApprovalStatus.REJECTED) {
      throw new UnauthorizedException('Your registration was not approved.');
    }
    if (user.accountApprovalStatus === AccountApprovalStatus.PENDING) {
      throw new UnauthorizedException(
        'Your account is awaiting admin approval. You will receive an email when you can sign in.',
      );
    }

    const tokens = await this.issueTokens(user.id, user.email);
    const planTier = effectivePlanTier(this.config, user.planTier);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        planTier,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokenHash = this.hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      throw new UnauthorizedException('Refresh token not recognized. Please sign in again.');
    }

    if (stored.userId !== payload.sub) {
      await this.revokeFamily(stored.familyId, 'user_mismatch');
      throw new UnauthorizedException('Refresh token user mismatch');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    if (stored.revokedAt) {
      // Token reuse detected — assume compromise; nuke the whole family.
      await this.revokeFamily(stored.familyId, 'reuse_detected');
      throw new UnauthorizedException('Refresh token has been revoked. Please sign in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      await this.revokeFamily(stored.familyId, 'user_missing');
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (this.email.isConfigured() && !user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    if (user.accountApprovalStatus === AccountApprovalStatus.REJECTED) {
      throw new UnauthorizedException('Account not approved');
    }
    if (user.accountApprovalStatus === AccountApprovalStatus.PENDING) {
      throw new UnauthorizedException('Account awaiting admin approval');
    }

    const tokens = await this.issueTokens(payload.sub, payload.email, {
      familyId: stored.familyId,
      parentId: stored.id,
    });

    const issuedRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(tokens.refreshToken) },
      select: { id: true },
    });

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: {
        revokedAt: new Date(),
        replacedBy: issuedRecord?.id ?? null,
      },
    });

    const fresh = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, planTier: true, emailVerified: true, createdAt: true },
    });
    return {
      user: fresh ? { ...fresh, planTier: effectivePlanTier(this.config, fresh.planTier) } : fresh,
      ...tokens,
    };
  }

  async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logout(refreshToken: string) {
    if (!refreshToken) return { message: 'Logged out.' };
    const tokenHash = this.hashRefreshToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logged out.' };
  }

  private async notifyAdminsOfPendingRegistration(email: string, name: string | null) {
    if (!this.email.isConfigured()) return;
    const admins = adminEmails(this.config);
    await Promise.all(
      admins.map((admin) =>
        this.email.sendAdminRegistrationPendingEmail(admin, email, name),
      ),
    );
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseRefreshExpiryMs(): number {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const match = /^(\d+)\s*([smhd]?)$/i.exec(raw.trim());
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = (match[2] || 's').toLowerCase();
    const mult =
      unit === 'd' ? 86_400_000
      : unit === 'h' ? 3_600_000
      : unit === 'm' ? 60_000
      : 1000;
    return value * mult;
  }

  private async revokeFamily(familyId: string, _reason: string) {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    rotation?: { familyId: string; parentId: string },
  ) {
    const payload = { sub: userId, email };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );

    const tokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.parseRefreshExpiryMs());
    const familyId = rotation?.familyId ?? randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId,
        parentId: rotation?.parentId ?? null,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
