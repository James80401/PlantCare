import { HttpException } from '@nestjs/common';
import { AiUsageService } from './ai-usage.service';

describe('AiUsageService', () => {
  function createService(options: { count?: number; pausedUntil?: Date } = {}) {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ aiPausedUntil: options.pausedUntil ?? null }),
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
});
