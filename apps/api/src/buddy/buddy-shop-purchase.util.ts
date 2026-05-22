import { ItemUnlockType } from '@prisma/client';
import { stageMeetsTier } from './constants/shop-seed-data';
import { isSeasonalItemAvailable } from './constants/seasonal-events';

export type PurchaseLockReason = 'premium' | 'seasonal' | 'species' | 'stage' | 'funds';

export interface ShopItemPurchaseInput {
  id: string;
  cost: number;
  bloomTokenCost: number;
  tier: number;
  speciesLocked: string | null;
  unlockType: ItemUnlockType;
  requiresPremium: boolean;
  seasonalEventId: string | null;
}

export interface BuddyPurchaseContext {
  growthStage: string;
  speciesId: string;
  dewdrops: number;
  bloomTokens: number;
}

export function getPurchaseLockReason(
  item: ShopItemPurchaseInput,
  buddy: BuddyPurchaseContext,
  ownedIds: Set<string>,
  isPremium: boolean,
  at = new Date(),
): PurchaseLockReason | undefined {
  if (ownedIds.has(item.id)) return undefined;
  if (item.requiresPremium && !isPremium) return 'premium';
  if (item.seasonalEventId && !isSeasonalItemAvailable(item.seasonalEventId, at)) {
    return 'seasonal';
  }
  if (item.speciesLocked && item.speciesLocked !== buddy.speciesId) return 'species';
  if (!stageMeetsTier(buddy.growthStage, item.tier)) return 'stage';
  if (item.bloomTokenCost > 0) {
    if (buddy.speciesId !== 'rose') return 'species';
    if (buddy.bloomTokens < item.bloomTokenCost) return 'funds';
    return undefined;
  }
  if (
    item.unlockType !== ItemUnlockType.PURCHASE &&
    item.unlockType !== ItemUnlockType.SEASONAL_EVENT
  ) {
    return 'stage';
  }
  if (item.cost > 0 && buddy.dewdrops < item.cost) return 'funds';
  return undefined;
}

export function canPurchaseShopItem(
  item: ShopItemPurchaseInput,
  buddy: BuddyPurchaseContext,
  ownedIds: Set<string>,
  isPremium: boolean,
  at = new Date(),
): boolean {
  return getPurchaseLockReason(item, buddy, ownedIds, isPremium, at) === undefined;
}

export function purchaseDenialMessage(
  lock: PurchaseLockReason,
  item?: Pick<ShopItemPurchaseInput, 'bloomTokenCost'>,
): string {
  if (lock === 'funds') {
    return item && item.bloomTokenCost > 0
      ? 'Not enough Bloom Tokens'
      : 'Not enough dewdrops';
  }
  const messages: Record<Exclude<PurchaseLockReason, 'funds'>, string> = {
    premium: 'Premium subscription required for this item',
    seasonal: 'This item is only available during its seasonal event',
    species: 'Your buddy cannot purchase this item yet',
    stage: 'Grow your buddy to unlock this item',
  };
  return messages[lock];
}
