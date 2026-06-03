import { UnauthorizedException } from '@nestjs/common';
import { AccountApprovalStatus, PlanTier } from '@prisma/client';
import { AuthService } from './auth.service';

describe('AuthService premium behavior', () => {
  function createService() {
    const createdUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      planTier: PlanTier.FREE,
      emailVerified: true,
      createdAt: new Date(),
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(createdUser),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const jwt = {
      sign: jest.fn((payload: unknown) => `token-${JSON.stringify(payload)}`),
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'REGISTRATION_REQUIRES_ADMIN_APPROVAL') return 'false';
        if (key === 'ALL_USERS_PREMIUM') return 'false';
        return fallback;
      }),
    };
    const email = { isConfigured: jest.fn().mockReturnValue(false) };
    const service = new AuthService(prisma as never, jwt as never, config as never, email as never);
    return { service, prisma };
  }

  it('creates new users on the Free plan by default', async () => {
    const { service, prisma } = createService();

    const result = await service.register({
      email: 'user@example.com',
      password: 'password123',
      name: 'User',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ planTier: PlanTier.FREE }),
      }),
    );
    expect((result as { user: { planTier: PlanTier } }).user.planTier).toBe(PlanTier.FREE);
  });
});

describe('AuthService refresh token rotation', () => {
  function createService(storedOverrides: Record<string, unknown> = {}) {
    const stored = {
      id: 'rt-1',
      userId: 'user-1',
      tokenHash: 'will-be-overwritten',
      familyId: 'fam-1',
      parentId: null,
      replacedBy: null,
      revokedAt: null as Date | null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      ...storedOverrides,
    };
    const user = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      planTier: PlanTier.FREE,
      emailVerified: true,
      accountApprovalStatus: AccountApprovalStatus.APPROVED,
      createdAt: new Date(),
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
      refreshToken: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    // Order matters: lookup by parent hash first, then lookup by new-issued hash.
    prisma.refreshToken.findUnique
      .mockResolvedValueOnce(stored)
      .mockResolvedValue({ id: 'rt-2' });

    const jwt = {
      sign: jest.fn((payload: unknown) => `token-${JSON.stringify(payload)}`),
      verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'user@example.com' }),
    };
    const config = {
      get: jest.fn((_key: string, fallback?: string) => fallback),
    };
    const email = { isConfigured: jest.fn().mockReturnValue(false) };
    const service = new AuthService(prisma as never, jwt as never, config as never, email as never);
    return { service, prisma, stored };
  }

  it('revokes the family when a long-revoked token is replayed', async () => {
    const { service, prisma } = createService({
      revokedAt: new Date(Date.now() - 60_000), // 60s old — well past 10s grace
      replacedBy: 'rt-2',
    });

    await expect(service.refresh('any-token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'fam-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('allows a concurrent refresh inside the grace window without nuking the family', async () => {
    const { service, prisma } = createService({
      revokedAt: new Date(Date.now() - 2_000), // 2s ago — inside 10s grace
      replacedBy: 'rt-2',
    });

    const result = await service.refresh('any-token');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    // Family-revocation should NOT have been called.
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });
});
