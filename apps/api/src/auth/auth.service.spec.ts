import { PlanTier } from '@prisma/client';
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
