import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountApprovalStatus } from '@prisma/client';
import { subDays, subHours } from 'date-fns';
import { isAdminEmail } from '../config/registration-policy';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminObservabilityService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async overview() {
    const now = new Date();
    const last24h = subHours(now, 24);
    const last30d = subDays(now, 30);

    const [
      totalUsers,
      approvedUsers,
      pendingUsers,
      disabledUsers,
      verifiedUsers,
      newUsers24h,
      newUsers30d,
      users,
      ai30d,
      ai24h,
      aiTopUsers,
      pausedUsers,
      notification30d,
      activeDeviceTokens,
      audit30d,
      auditFailures30d,
      latestAiEvents,
      latestAdminActions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { accountApprovalStatus: AccountApprovalStatus.APPROVED } }),
      this.prisma.user.count({ where: { accountApprovalStatus: AccountApprovalStatus.PENDING } }),
      this.prisma.user.count({ where: { accountApprovalStatus: AccountApprovalStatus.REJECTED } }),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      this.prisma.user.count({ where: { createdAt: { gte: last30d } } }),
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          aiPausedUntil: true,
          createdAt: true,
          _count: { select: { plants: true } },
        },
      }),
      this.groupAiUsage(last30d),
      this.groupAiUsage(last24h),
      this.prisma.aiUsageEvent.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: last30d } },
        _count: { _all: true },
        _sum: { promptChars: true, imageCount: true },
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
      this.prisma.user.findMany({
        where: { aiPausedUntil: { gt: now } },
        orderBy: { aiPausedUntil: 'asc' },
        take: 25,
        select: { id: true, email: true, name: true, aiPausedUntil: true },
      }),
      this.prisma.notificationLog.groupBy({
        by: ['channel', 'status'],
        where: { createdAt: { gte: last30d } },
        _count: { _all: true },
      }),
      this.prisma.deviceToken.count(),
      this.prisma.adminAuditLog.count({ where: { createdAt: { gte: last30d } } }),
      this.prisma.adminAuditLog.count({
        where: { createdAt: { gte: last30d }, outcome: 'ERROR' },
      }),
      this.prisma.aiUsageEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: {
          id: true,
          userId: true,
          feature: true,
          status: true,
          reason: true,
          promptChars: true,
          imageCount: true,
          createdAt: true,
        },
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          actorEmail: true,
          action: true,
          outcome: true,
          statusCode: true,
          durationMs: true,
          createdAt: true,
        },
      }),
    ]);

    const userById = new Map(users.map((user) => [user.id, user]));
    const topAiUsers = aiTopUsers.map((row) => {
      const user = userById.get(row.userId);
      return {
        userId: row.userId,
        email: user?.email ?? 'Unknown user',
        name: user?.name ?? null,
        calls: row._count._all,
        promptChars: row._sum.promptChars ?? 0,
        imageCount: row._sum.imageCount ?? 0,
        plants: user?._count.plants ?? 0,
      };
    });

    const adminUsers = users.filter((user) => isAdminEmail(this.config, user.email)).length;
    const usersWithPlants = users.filter((user) => user._count.plants > 0).length;

    return {
      generatedAt: now.toISOString(),
      windows: {
        last24h: last24h.toISOString(),
        last30d: last30d.toISOString(),
      },
      users: {
        total: totalUsers,
        approved: approvedUsers,
        pending: pendingUsers,
        disabled: disabledUsers,
        verified: verifiedUsers,
        admins: adminUsers,
        new24h: newUsers24h,
        new30d: newUsers30d,
        withPlants: usersWithPlants,
      },
      ai: {
        last24h: summarizeAiGroups(ai24h),
        last30d: summarizeAiGroups(ai30d),
        pausedUsers,
        topUsers: topAiUsers,
        latestEvents: latestAiEvents.map((event) => ({
          ...event,
          user: userById.get(event.userId)
            ? {
                email: userById.get(event.userId)!.email,
                name: userById.get(event.userId)!.name,
              }
            : null,
        })),
      },
      notifications: {
        activeDeviceTokens,
        last30d: notification30d.map((row) => ({
          channel: row.channel,
          status: row.status,
          count: row._count._all,
        })),
      },
      audit: {
        last30d: audit30d,
        failures30d: auditFailures30d,
        latestActions: latestAdminActions,
      },
    };
  }

  private groupAiUsage(since: Date) {
    return this.prisma.aiUsageEvent.groupBy({
      by: ['status'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { promptChars: true, imageCount: true },
    });
  }
}

function summarizeAiGroups(
  groups: { status: string; _count: { _all: number }; _sum: { promptChars: number | null; imageCount: number | null } }[],
) {
  const byStatus = groups.map((row) => ({
    status: row.status,
    count: row._count._all,
    promptChars: row._sum.promptChars ?? 0,
    imageCount: row._sum.imageCount ?? 0,
  }));
  return {
    total: byStatus.reduce((sum, row) => sum + row.count, 0),
    allowed: byStatus.find((row) => row.status === 'ALLOWED')?.count ?? 0,
    blocked: byStatus
      .filter((row) => row.status !== 'ALLOWED')
      .reduce((sum, row) => sum + row.count, 0),
    promptChars: byStatus.reduce((sum, row) => sum + row.promptChars, 0),
    imageCount: byStatus.reduce((sum, row) => sum + row.imageCount, 0),
    byStatus,
  };
}
