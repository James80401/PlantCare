import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BuddyQuestService } from './buddy-quest.service';

const BUDDY = { id: 'buddy-1', userId: 'user-1', dewdrops: 0, experiencePoints: 0 };

const PROGRESS = {
  id: 'progress-1',
  buddyId: 'buddy-1',
  questId: 'quest-1',
  completed: true,
  rewardClaimed: false,
  quest: { id: 'quest-1', rewardDewdrops: 10 },
};

describe('BuddyQuestService.claim', () => {
  function createService(overrides: { progress?: object | null } = {}) {
    const progress = overrides.progress === undefined ? PROGRESS : overrides.progress;
    const prisma = {
      buddy: {
        findUnique: jest.fn().mockResolvedValue(BUDDY),
        update: jest.fn().mockResolvedValue({ ...BUDDY, dewdrops: 10, experiencePoints: 15 }),
      },
      buddyQuestProgress: {
        findUnique: jest.fn().mockResolvedValue(progress),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    (prisma as { $transaction?: unknown }).$transaction = jest.fn(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    const service = new BuddyQuestService(prisma as never);
    return { service, prisma };
  }

  it('claims a completed, unclaimed quest', async () => {
    const { service, prisma } = createService();

    const result = await service.claim('user-1', 'quest-1');

    expect(prisma.buddyQuestProgress.updateMany).toHaveBeenCalledWith({
      where: { id: 'progress-1', rewardClaimed: false },
      data: { rewardClaimed: true },
    });
    expect(result.dewdropsAwarded).toBe(10);
    expect(result.dewdrops).toBe(10);
  });

  it('rejects an unfinished quest', async () => {
    const { service } = createService({ progress: { ...PROGRESS, completed: false } });

    await expect(service.claim('user-1', 'quest-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when progress does not exist', async () => {
    const { service } = createService({ progress: null });

    await expect(service.claim('user-1', 'quest-1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a claim already marked claimed by the pre-check', async () => {
    const { service, prisma } = createService({ progress: { ...PROGRESS, rewardClaimed: true } });

    await expect(service.claim('user-1', 'quest-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.buddyQuestProgress.updateMany).not.toHaveBeenCalled();
  });

  it('rejects when the atomic claim fails even though the pre-check passed', async () => {
    const { service, prisma } = createService();
    prisma.buddyQuestProgress.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.claim('user-1', 'quest-1')).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.buddy.update).not.toHaveBeenCalled();
  });

  it('never lets two concurrent claims both award the reward', async () => {
    // Simulates the real DB serializing concurrent `UPDATE ... WHERE rewardClaimed =
    // false` statements against the same row: only the first matches.
    const { service, prisma } = createService();
    prisma.buddyQuestProgress.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const [first, second] = await Promise.allSettled([
      service.claim('user-1', 'quest-1'),
      service.claim('user-1', 'quest-1'),
    ]);

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
    expect(prisma.buddy.update).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when the user has no buddy', async () => {
    const { service, prisma } = createService();
    prisma.buddy.findUnique.mockResolvedValue(null);

    await expect(service.claim('user-1', 'quest-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
