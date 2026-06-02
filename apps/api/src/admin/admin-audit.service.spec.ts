import { AdminAuditService, ADMIN_AUDIT_RETENTION_DAYS } from './admin-audit.service';

describe('AdminAuditService', () => {
  function createService() {
    const rows = [
      {
        id: 'audit-1',
        actorUserId: 'admin-1',
        actorEmail: 'admin@example.com',
        action: 'account.approve',
        method: 'POST',
        path: '/api/v1/admin/registrations/user-1/approve',
        targetUserId: 'user-1',
        requestId: 'req-1',
        statusCode: 201,
        outcome: 'SUCCESS',
        durationMs: 12,
        ip: '127.0.0.1',
        userAgent: 'jest',
        metadataJson: '{"route":":userId/approve"}',
        createdAt: new Date(),
      },
    ];
    const prisma = {
      $transaction: jest.fn(async (ops: unknown[]) => Promise.all(ops)),
      adminAuditLog: {
        create: jest.fn().mockResolvedValue(rows[0]),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue(rows),
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(1),
        findFirst: jest.fn().mockResolvedValue(rows[0]),
        groupBy: jest.fn().mockResolvedValue([
          { action: 'account.approve', _count: { _all: 2 } },
          { action: 'account.disable', _count: { _all: 1 } },
        ]),
      },
    };
    return { service: new AdminAuditService(prisma as never), prisma, rows };
  }

  it('records a sanitized admin action and prunes expired rows', async () => {
    const { service, prisma } = createService();

    await service.record({
      actorUserId: 'admin-1',
      actorEmail: 'admin@example.com',
      action: 'account.approve',
      method: 'POST',
      path: '/api/v1/admin/registrations/user-1/approve',
      targetUserId: 'user-1',
      requestId: 'req-1',
      statusCode: 201,
      outcome: 'SUCCESS',
      durationMs: 12,
      ip: '127.0.0.1',
      userAgent: 'jest',
      metadata: { route: ':userId/approve' },
    });

    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorEmail: 'admin@example.com',
        action: 'account.approve',
        targetUserId: 'user-1',
        outcome: 'SUCCESS',
        metadataJson: '{"route":":userId/approve"}',
      }),
    });
    expect(prisma.adminAuditLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });

  it('lists only recent audit entries and parses metadata', async () => {
    const { service, prisma } = createService();

    const rows = await service.listRecent(500);

    expect(prisma.adminAuditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 250,
        where: { createdAt: { gte: expect.any(Date) } },
      }),
    );
    expect(rows[0].metadata).toEqual({ route: ':userId/approve' });
    expect(rows[0].metadataJson).toBeUndefined();
  });

  it('summarizes the 30-day audit window', async () => {
    const { service } = createService();

    const summary = await service.summary();

    expect(summary.retentionDays).toBe(ADMIN_AUDIT_RETENTION_DAYS);
    expect(summary.total).toBe(3);
    expect(summary.failures).toBe(1);
    expect(summary.byAction).toEqual([
      { action: 'account.approve', count: 2 },
      { action: 'account.disable', count: 1 },
    ]);
  });
});
