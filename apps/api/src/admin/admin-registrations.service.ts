import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountApprovalStatus } from '@prisma/client';
import { subHours, subMinutes } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { isAdminEmail } from '../config/registration-policy';

@Injectable()
export class AdminRegistrationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private config: ConfigService,
  ) {}

  async listPending() {
    return this.prisma.user.findMany({
      where: { accountApprovalStatus: AccountApprovalStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        accountApprovalStatus: true,
        planTier: true,
        aiPausedUntil: true,
        createdAt: true,
        _count: { select: { plants: true } },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { status: true, planName: true, createdAt: true },
        },
      },
    });
    return Promise.all(
      users.map(async (user) => ({
        ...user,
        isAdmin: isAdminEmail(this.config, user.email),
        aiUsage: await this.getAiUsageSummary(user.id),
      })),
    );
  }

  async approve(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.accountApprovalStatus === AccountApprovalStatus.APPROVED) {
      return { message: 'Account already approved', userId, email: user.email };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.APPROVED },
    });

    if (this.email.isConfigured()) {
      await this.email.sendAccountApprovedEmail(user.email, user.name);
    }

    return { message: 'Account approved', userId, email: user.email };
  }

  async reject(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    this.assertNotAdmin(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });
    await this.revokeAllRefreshTokens(userId);

    return { message: 'Account rejected', userId, email: user.email };
  }

  async disable(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    this.assertNotAdmin(user.email);

    await this.prisma.user.update({
      where: { id: userId },
      data: { accountApprovalStatus: AccountApprovalStatus.REJECTED },
    });
    await this.revokeAllRefreshTokens(userId);

    return { message: 'Account disabled', userId, email: user.email };
  }

  async unpauseAi(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { aiPausedUntil: null },
    });

    await this.prisma.aiUsageEvent.create({
      data: {
        userId,
        feature: 'admin',
        status: 'ADMIN_UNPAUSED',
        reason: 'AI pause cleared by admin',
      },
    });

    return { message: 'Dr. Plant AI access unpaused', userId, email: user.email };
  }

  private async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private assertNotAdmin(email: string) {
    if (isAdminEmail(this.config, email)) {
      throw new BadRequestException('Admin accounts cannot be disabled from this portal.');
    }
  }

  private async getAiUsageSummary(userId: string) {
    const now = new Date();
    const oneHourAgo = subMinutes(now, 60);
    const dayAgo = subHours(now, 24);
    const [totalCalls, lastHourCalls, last24HourCalls, offTopicBlocks, rateLimitBlocks, latest] =
      await Promise.all([
        this.prisma.aiUsageEvent.count({
          where: { userId, status: { in: ['ALLOWED', 'SUCCEEDED'] } },
        }),
        this.prisma.aiUsageEvent.count({
          where: {
            userId,
            status: { in: ['ALLOWED', 'SUCCEEDED'] },
            createdAt: { gte: oneHourAgo },
          },
        }),
        this.prisma.aiUsageEvent.count({
          where: {
            userId,
            status: { in: ['ALLOWED', 'SUCCEEDED'] },
            createdAt: { gte: dayAgo },
          },
        }),
        this.prisma.aiUsageEvent.count({
          where: { userId, status: 'BLOCKED_OFF_TOPIC' },
        }),
        this.prisma.aiUsageEvent.count({
          where: { userId, status: { in: ['RATE_LIMITED', 'PAUSED'] } },
        }),
        this.prisma.aiUsageEvent.findFirst({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true, status: true, feature: true, reason: true },
        }),
      ]);

    return {
      totalCalls,
      lastHourCalls,
      last24HourCalls,
      offTopicBlocks,
      rateLimitBlocks,
      latest,
    };
  }
}
