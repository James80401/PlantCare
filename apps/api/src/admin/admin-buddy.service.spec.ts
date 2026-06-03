import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ItemCategory, ItemUnlockType } from '@prisma/client';
import { AdminBuddyService } from './admin-buddy.service';

const buddy = {
  id: 'buddy-1',
  userId: 'user-1',
  name: 'Sprout',
  speciesId: 'monstera',
  trait: 'RESILIENT',
  growthStage: 'SEED',
  journeyCount: 0,
  dewdrops: 0,
  experiencePoints: 0,
  bloomTokens: 0,
  sunlightToday: 0,
  tasksToday: 0,
  mood: 'HAPPY',
  streakDays: 0,
  longestStreak: 0,
  equippedItems: { potSkin: 'pot_mason', heldItem: 'held_trowel' },
  unlockedSpecies: ['monstera'],
  unlockedBiomes: ['seed_garden'],
  currentBiome: 'seed_garden',
  terrariumLayout: { slotA: 'furn_fountain' },
  terrariumBackground: 'greenhouse',
  floatingCompanionMode: 'hidden',
  gardenCode: 'SPROUT-TEST',
  journeys: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const item = {
  id: 'held_trowel',
  name: 'Trowel',
  description: 'Pocket garden tool.',
  category: ItemCategory.HELD_ITEM,
  tier: 1,
  cost: 50,
  bloomTokenCost: 0,
  seasonalEventId: null,
  requiresPremium: false,
  speciesLocked: null,
  unlockType: ItemUnlockType.PURCHASE,
  imageKey: 'held_trowel',
  sortOrder: 1,
  isActive: true,
};

describe('AdminBuddyService', () => {
  function createService(overrides: Record<string, unknown> = {}) {
    const tx = {
      buddyInventory: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      buddy: {
        update: jest.fn().mockResolvedValue(buddy),
      },
    };
    const prisma = {
      buddy: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(buddy),
        update: jest.fn().mockResolvedValue({ ...buddy, experiencePoints: 560 }),
      },
      shopItem: {
        findMany: jest.fn().mockResolvedValue([item]),
        findUnique: jest.fn().mockResolvedValue(item),
      },
      buddyInventory: {
        upsert: jest.fn().mockResolvedValue({ buddyId: buddy.id, itemId: item.id }),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
      ...overrides,
    };
    return { service: new AdminBuddyService(prisma as never), prisma, tx };
  }

  it('sets experience points to the requested level threshold', async () => {
    const { service, prisma } = createService();

    await service.setLevel('buddy-1', 6);

    expect(prisma.buddy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'buddy-1' },
        data: { experiencePoints: 560 },
      }),
    );
  });

  it('rejects invalid levels', async () => {
    const { service } = createService();

    await expect(service.setLevel('buddy-1', 99)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('unlocks items with admin acquire method', async () => {
    const { service, prisma } = createService();

    await service.unlockItem('buddy-1', 'held_trowel');

    expect(prisma.buddyInventory.upsert).toHaveBeenCalledWith({
      where: { buddyId_itemId: { buddyId: 'buddy-1', itemId: 'held_trowel' } },
      update: { acquireMethod: 'admin' },
      create: { buddyId: 'buddy-1', itemId: 'held_trowel', acquireMethod: 'admin' },
    });
  });

  it('locks items and removes equipped/layout/background references', async () => {
    const backgroundItem = { ...item, id: 'bg_greenhouse', category: ItemCategory.BACKGROUND };
    const { service, tx } = createService({
      shopItem: {
        findMany: jest.fn().mockResolvedValue([backgroundItem]),
        findUnique: jest.fn().mockResolvedValue(backgroundItem),
      },
    });

    await service.lockItem('buddy-1', 'bg_greenhouse');

    expect(tx.buddyInventory.deleteMany).toHaveBeenCalledWith({
      where: { buddyId: 'buddy-1', itemId: 'bg_greenhouse' },
    });
    expect(tx.buddy.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ terrariumBackground: 'sunny_windowsill' }),
      }),
    );
  });

  it('throws when the buddy is missing', async () => {
    const { service } = createService({
      buddy: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    });

    await expect(service.unlockItem('missing', 'held_trowel')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
