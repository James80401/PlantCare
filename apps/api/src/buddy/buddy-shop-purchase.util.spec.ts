import { ItemUnlockType } from '@prisma/client';
import {
  canPurchaseShopItem,
  getPurchaseLockReason,
  purchaseDenialMessage,
  type BuddyPurchaseContext,
  type ShopItemPurchaseInput,
} from './buddy-shop-purchase.util';

const baseBuddy: BuddyPurchaseContext = {
  growthStage: 'SPROUT',
  speciesId: 'monstera',
  dewdrops: 50,
  bloomTokens: 0,
};

function item(overrides: Partial<ShopItemPurchaseInput> = {}): ShopItemPurchaseInput {
  return {
    id: 'hat_test',
    cost: 20,
    bloomTokenCost: 0,
    tier: 1,
    speciesLocked: null,
    unlockType: ItemUnlockType.PURCHASE,
    requiresPremium: false,
    seasonalEventId: null,
    ...overrides,
  };
}

describe('buddy-shop-purchase.util', () => {
  it('allows purchase when funds and tier meet requirements', () => {
    expect(
      canPurchaseShopItem(item(), baseBuddy, new Set(), true),
    ).toBe(true);
  });

  it('blocks premium items for non-premium users', () => {
    const lock = getPurchaseLockReason(
      item({ requiresPremium: true }),
      baseBuddy,
      new Set(),
      false,
    );
    expect(lock).toBe('premium');
    expect(purchaseDenialMessage('premium')).toContain('Premium');
  });

  it('blocks seasonal items outside the event window', () => {
    const winter = new Date('2026-02-15T12:00:00Z');
    const lock = getPurchaseLockReason(
      item({ seasonalEventId: 'spring_garden_2026', unlockType: ItemUnlockType.SEASONAL_EVENT }),
      baseBuddy,
      new Set(),
      true,
      winter,
    );
    expect(lock).toBe('seasonal');
  });

  it('allows seasonal items during the active window', () => {
    const spring = new Date('2026-04-10T12:00:00Z');
    expect(
      canPurchaseShopItem(
        item({ seasonalEventId: 'spring_garden_2026', unlockType: ItemUnlockType.SEASONAL_EVENT }),
        baseBuddy,
        new Set(),
        true,
        spring,
      ),
    ).toBe(true);
  });

  it('blocks purchase when dewdrops are insufficient', () => {
    const lock = getPurchaseLockReason(
      item({ cost: 100 }),
      { ...baseBuddy, dewdrops: 10 },
      new Set(),
      true,
    );
    expect(lock).toBe('funds');
    expect(purchaseDenialMessage('funds')).toBe('Not enough dewdrops');
  });

  it('blocks bloom token items for non-rose buddies', () => {
    const lock = getPurchaseLockReason(
      item({ bloomTokenCost: 2, cost: 0 }),
      baseBuddy,
      new Set(),
      true,
    );
    expect(lock).toBe('species');
  });

  it('blocks rose bloom purchases without enough tokens', () => {
    const roseBuddy: BuddyPurchaseContext = {
      ...baseBuddy,
      speciesId: 'rose',
      bloomTokens: 1,
    };
    const lock = getPurchaseLockReason(
      item({ bloomTokenCost: 3, cost: 0 }),
      roseBuddy,
      new Set(),
      true,
    );
    expect(lock).toBe('funds');
    expect(purchaseDenialMessage('funds', { bloomTokenCost: 3 })).toBe('Not enough Bloom Tokens');
  });

  it('treats owned items as unlocked (no lock reason)', () => {
    expect(getPurchaseLockReason(item(), baseBuddy, new Set(['hat_test']), true)).toBeUndefined();
  });
});
