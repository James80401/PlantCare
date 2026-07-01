import { HttpException } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';

describe('AiUsageService', () => {
  function createService(
    options: { count?: number; pausedUntil?: Date; planTier?: 'FREE' | 'PREMIUM' } = {},
  ) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          aiPausedUntil: options.pausedUntil ?? null,
          planTier: options.planTier ?? 'FREE',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      aiUsageEvent: {
        count: jest.fn().mockResolvedValue(options.count ?? 0),
        create: jest.fn().mockResolvedValue({}),
      },
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_RATE_LIMIT_MAX_CALLS') return '2';
        if (key === 'AI_RATE_LIMIT_WINDOW_MINUTES') return '60';
        if (key === 'AI_RATE_LIMIT_PAUSE_HOURS') return '12';
        return undefined;
      }),
    };
    return { service: new AiUsageService(prisma as never, config as never), prisma };
  }

  it('allows plant-care language', async () => {
    const { service, prisma } = createService();

    await service.assertPlantIntentOrThrow({
      feature: 'diagnosis_chat',
      userId: 'user-1',
      text: 'Why are my leaves yellow?',
    });

    expect(prisma.aiUsageEvent.create).not.toHaveBeenCalled();
  });

  it('blocks clearly unrelated prompts', async () => {
    const { service, prisma } = createService();

    await expect(
      service.assertPlantIntentOrThrow({
        feature: 'diagnosis_chat',
        userId: 'user-1',
        text: 'Write me a Python scraper',
      }),
    ).rejects.toBeInstanceOf(HttpException);
    expect(prisma.aiUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'BLOCKED_OFF_TOPIC' }),
      }),
    );
  });

  it('pauses users when they exceed the configured call rate', async () => {
    const { service, prisma } = createService({ count: 2 });

    await expect(
      service.reserveCall({ feature: 'diagnosis', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(HttpException);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { aiPausedUntil: expect.any(Date) },
      }),
    );
    expect(prisma.aiUsageEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'RATE_LIMITED' }),
      }),
    );
  });

  describe('free-tier monthly diagnosis cap', () => {
    it('blocks a free user at the monthly diagnosis limit even under the rolling rate limit', async () => {
      // 5 calls in the last 30 days already (the free diagnosis cap), well under the
      // rolling rate limiter's own threshold — the monthly cap should trip first.
      const { service, prisma } = createService({ count: 5 });

      await expect(
        service.reserveCall({ feature: 'diagnosis', userId: 'user-1' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'AI_MONTHLY_LIMIT_REACHED' }),
      });
      expect(prisma.aiUsageEvent.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ feature: 'diagnosis', status: 'ALLOWED' }),
        }),
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('applies a separate cap for Dr. Plant chat', async () => {
      const { service, prisma } = createService({ count: 10 });

      await expect(
        service.reserveCall({ feature: 'diagnosis_chat', userId: 'user-1' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'AI_MONTHLY_LIMIT_REACHED', limit: 10 }),
      });
      expect(prisma.aiUsageEvent.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ feature: 'diagnosis_chat' }),
        }),
      );
    });

    it('allows a free user under the monthly cap', async () => {
      const { service, prisma } = createService();
      // First count() call is the monthly-cap check (under the cap of 5); second is the
      // rolling rate limiter (under its configured max of 2).
      prisma.aiUsageEvent.count
        .mockResolvedValueOnce(4)
        .mockResolvedValueOnce(0);

      await service.reserveCall({ feature: 'diagnosis', userId: 'user-1' });

      expect(prisma.aiUsageEvent.count).toHaveBeenCalledTimes(2);
      expect(prisma.aiUsageEvent.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ALLOWED' }) }),
      );
    });

    it('does not cap premium users regardless of monthly usage', async () => {
      const { service, prisma } = createService({ count: 0, planTier: 'PREMIUM' });

      await service.reserveCall({ feature: 'diagnosis', userId: 'user-1' });

      // Only the rolling rate limiter's count() call happens; the monthly-cap check is
      // skipped entirely for premium accounts.
      expect(prisma.aiUsageEvent.count).toHaveBeenCalledTimes(1);
      expect(prisma.aiUsageEvent.create).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'ALLOWED' }) }),
      );
    });
  });
});
