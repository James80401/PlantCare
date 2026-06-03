import { UnauthorizedException } from '@nestjs/common';
import { AccountApprovalStatus, PlanTier } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  function createStrategy(planTier: PlanTier = PlanTier.FREE, allPremium = false) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          planTier,
          emailVerified: true,
          accountApprovalStatus: AccountApprovalStatus.APPROVED,
        }),
      },
    };
    const config = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        if (key === 'ALL_USERS_PREMIUM') return allPremium ? 'true' : 'false';
        return fallback;
      }),
    };
    const email = { isConfigured: jest.fn().mockReturnValue(true) };
    return { strategy: new JwtStrategy(config as never, prisma as never, email as never), prisma };
  }

  it('returns the actual user plan tier', async () => {
    const { strategy } = createStrategy(PlanTier.FREE);

    await expect(strategy.validate({ sub: 'user-1', email: 'user@example.com' })).resolves.toMatchObject({
      planTier: PlanTier.FREE,
    });
  });

  it('honors ALL_USERS_PREMIUM as an effective dev override', async () => {
    const { strategy } = createStrategy(PlanTier.FREE, true);

    await expect(strategy.validate({ sub: 'user-1', email: 'user@example.com' })).resolves.toMatchObject({
      planTier: PlanTier.PREMIUM,
    });
  });

  it('rejects pending accounts before plan checks matter', async () => {
    const { strategy, prisma } = createStrategy(PlanTier.PREMIUM);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      planTier: PlanTier.PREMIUM,
      emailVerified: true,
      accountApprovalStatus: AccountApprovalStatus.PENDING,
    });

    await expect(strategy.validate({ sub: 'user-1', email: 'user@example.com' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
