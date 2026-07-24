import { AccountApprovalStatus } from '@prisma/client';
import { AdminObservabilityService } from './admin-observability.service';

describe('AdminObservabilityService', () => {
  function createService() {
    const users = [
      {
        id: 'admin-1',
        email: 'admin@example.com',
        name: 'Admin',
        aiPausedUntil: null,
        createdAt: new Date(),
        _count: { plants: 0 },
      },
      {
        id: 'user-1',
        email: 'user@example.com',
        name: null,
        aiPausedUntil: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        _count: { plants: 3 },
      },
    ];
    const prisma = {
      user: {
        count: jest
          .fn()
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(2)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1)
          .mockResolvedValueOnce(1),
        findMany: jest
          .fn()
          .mockResolvedValueOnce(users)
          .mockResolvedValueOnce([users[1]]),
      },
      aiUsageEvent: {
        groupBy: jest
          .fn()
          .mockResolvedValueOnce([
            {
              status: 'ALLOWED',
              _count: { _all: 5 },
              _sum: { promptChars: 1000, imageCount: 2 },
            },
            {
              status: 'BLOCKED_OFF_TOPIC',
              _count: { _all: 1 },
              _sum: { promptChars: 30, imageCount: 0 },
            },
          ])
          .mockResolvedValueOnce([
            {
              status: 'ALLOWED',
              _count: { _all: 2 },
              _sum: { promptChars: 400, imageCount: 1 },
            },
          ])
          .mockResolvedValueOnce([
            {
              userId: 'user-1',
              _count: { _all: 6 },
              _sum: { promptChars: 1030, imageCount: 2 },
            },
          ]),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ai-1',
            userId: 'user-1',
            feature: 'diagnosis_chat',
            status: 'ALLOWED',
            reason: null,
            promptChars: 120,
            imageCount: 1,
            createdAt: new Date(),
          },
        ]),
      },
      notificationLog: {
        groupBy: jest.fn().mockResolvedValue([
          { channel: 'EMAIL', status: 'sent', _count: { _all: 3 } },
        ]),
      },
      deviceToken: {
        count: jest.fn().mockResolvedValue(4),
      },
      adminAuditLog: {
        count: jest.fn().mockResolvedValueOnce(9).mockResolvedValueOnce(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'audit-1',
            actorEmail: 'admin@example.com',
            action: 'account.list',
            outcome: 'SUCCESS',
            statusCode: 200,
            durationMs: 20,
            createdAt: new Date(),
          },
        ]),
      },
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'ADMIN_EMAILS') return 'admin@example.com';
        if (key === 'APP_VERSION') return '1.1.0';
        if (key === 'APP_COMMIT_SHA') return 'abc123';
        return fallback;
      }),
    };
    return { service: new AdminObservabilityService(prisma as never, config as never), prisma };
  }

  it('summarizes user, AI, notification, and audit health', async () => {
    const { service, prisma } = createService();

    const overview = await service.overview();

    expect(overview.users).toEqual(
      expect.objectContaining({
        total: 2,
        approved: 1,
        pending: 1,
        disabled: 0,
        verified: 2,
        admins: 1,
        withPlants: 1,
      }),
    );
    expect(overview.ai.last30d.total).toBe(6);
    expect(overview.ai.last30d.blocked).toBe(1);
    expect(overview.ai.last24h.allowed).toBe(2);
    expect(overview.ai.pausedUsers).toHaveLength(1);
    expect(overview.ai.topUsers[0]).toEqual(
      expect.objectContaining({ email: 'user@example.com', calls: 6, imageCount: 2 }),
    );
    expect(overview.notifications.activeDeviceTokens).toBe(4);
    expect(overview.audit.failures30d).toBe(1);
    expect(overview.activation).toEqual({
      approved: 1,
      withGardens: 2,
      withPlants: 1,
      completedFirstTask: 1,
      usedDiagnosisOrChat: 1,
    });
    expect(overview.release).toEqual({ version: '1.1.0', commit: 'abc123' });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: { accountApprovalStatus: AccountApprovalStatus.APPROVED },
    });
    expect(prisma.aiUsageEvent.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['status'],
        where: { createdAt: { gte: expect.any(Date) } },
      }),
    );
    expect(prisma.notificationLog.groupBy).toHaveBeenCalledWith({
      by: ['channel', 'status'],
      where: { attemptedAt: { gte: expect.any(Date) } },
      _count: { _all: true },
    });
  });
});
