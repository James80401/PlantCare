import { BadRequestException, ConflictException } from '@nestjs/common';
import { ItemCategory, ItemUnlockType, PlanTier } from '@prisma/client';
import { BuddyShopService } from './buddy-shop.service';

const BUDDY = {
  id: 'buddy-1',
  userId: 'user-1',
  speciesId: 'monstera',
  growthStage: 'SEED',
  experiencePoints: 0,
  dewdrops: 100,
  bloomTokens: 0,
};

const ITEM = {
  id: 'item-1',
  name: 'Terra Cotta Pot',
  description: '',
  category: ItemCategory.POT_SKIN,
  tier: 1,
  cost: 100,
  bloomTokenCost: 0,
  seasonalEventId: null,
  requiresPremium: false,
  speciesLocked: null,
  unlockType: ItemUnlockType.PURCHASE,
  imageKey: 'pot',
  sortOrder: 0,
  isActive: true,
};

describe('BuddyShopService.purchase', () => {
  function createService(overrides: { buddy?: object; item?: object; owned?: string[] } = {}) {
    const buddy = { ...BUDDY, ...overrides.buddy };
    const prisma = {
      buddy: {
        findUnique: jest.fn().mockResolvedValue(buddy),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...buddy, dewdrops: 0 }),
      },
      shopItem: {
        findUnique: jest.fn().mockResolvedValue({ ...ITEM, ...overrides.item }),
      },
      buddyInventory: {
        findMany: jest.fn().mockResolvedValue((overrides.owned ?? []).map((itemId) => ({ itemId }))),
        create: jest.fn().mockResolvedValue({}),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ planTier: PlanTier.FREE }),
      },
    };
    (prisma as { $transaction?: unknown }).$transaction = jest.fn(
      (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
    );
    const service = new BuddyShopService(prisma as never);
    return { service, prisma };
  }

  it('spends dewdrops and grants the item on a normal purchase', async () => {
    const { service, prisma } = createService();

    const result = await service.purchase('user-1', { itemId: 'item-1' });

    expect(prisma.buddy.updateMany).toHaveBeenCalledWith({
      where: { id: 'buddy-1', dewdrops: { gte: 100 } },
      data: { dewdrops: { decrement: 100 } },
    });
    expect(prisma.buddyInventory.create).toHaveBeenCalledWith({
      data: { buddyId: 'buddy-1', itemId: 'item-1', acquireMethod: 'purchase' },
    });
    expect(result.item.id).toBe('item-1');
  });

  it('rejects a purchase when the fast-path balance check fails', async () => {
    const { service, prisma } = createService({ buddy: { dewdrops: 10 } });

    await expect(service.purchase('user-1', { itemId: 'item-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    // Never reaches the transaction at all — rejected by the pre-check.
    expect(prisma.buddy.updateMany).not.toHaveBeenCalled();
  });

  it('never lets two concurrent purchases both spend off the same stale balance', async () => {
    // Simulates the real DB serializing concurrent `UPDATE ... WHERE dewdrops >= cost`
    // statements against the same row: only the first matches.
    const { service, prisma } = createService();
    prisma.buddy.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const [first, second] = await Promise.allSettled([
      service.purchase('user-1', { itemId: 'item-1' }),
      service.purchase('user-1', { itemId: 'item-1' }),
    ]);

    expect(first.status).toBe('fulfilled');
    expect(second.status).toBe('rejected');
    expect((second as PromiseRejectedResult).reason).toBeInstanceOf(BadRequestException);
  });

  it('rejects when the atomic spend fails even though the fast-path check passed', async () => {
    const { service, prisma } = createService();
    prisma.buddy.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.purchase('user-1', { itemId: 'item-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.buddyInventory.create).not.toHaveBeenCalled();
  });

  it('rejects buying an item already owned', async () => {
    const { service, prisma } = createService({ owned: ['item-1'] });

    await expect(service.purchase('user-1', { itemId: 'item-1' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.buddy.updateMany).not.toHaveBeenCalled();
  });

  it('spends bloom tokens instead of dewdrops for a bloom-token item', async () => {
    const { service, prisma } = createService({
      buddy: { speciesId: 'rose', bloomTokens: 5 },
      item: { bloomTokenCost: 3, cost: 0 },
    });

    await service.purchase('user-1', { itemId: 'item-1' });

    expect(prisma.buddy.updateMany).toHaveBeenCalledWith({
      where: { id: 'buddy-1', bloomTokens: { gte: 3 } },
      data: { bloomTokens: { decrement: 3 } },
    });
    expect(prisma.buddyInventory.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ acquireMethod: 'bloom_token' }) }),
    );
  });
});
