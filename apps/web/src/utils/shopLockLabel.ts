import type { ShopItem } from '../hooks/buddy/shopTypes';

/** Short label for shop grid / daily rotation when an item cannot be bought yet. */
export function shopLockLabel(item: ShopItem, dewdrops: number): string {
  if (item.owned) return 'Owned';

  switch (item.lockedReason) {
    case 'premium':
      return 'Premium item';
    case 'seasonal':
      return 'Seasonal — available during the event';
    case 'species':
      if (item.bloomTokenCost && item.bloomTokenCost > 0) return 'Rose buddies only';
      return 'Unlock the right species first';
    case 'stage':
      return 'Grow your buddy to unlock';
    case 'funds':
      if (item.bloomTokenCost && item.bloomTokenCost > 0) {
        return `${item.bloomTokenCost} 🌸 · need more tokens`;
      }
      return `${item.cost} 💧 · need more dewdrops`;
    default:
      break;
  }

  if (item.bloomTokenCost && item.bloomTokenCost > 0) {
    return `${item.bloomTokenCost} 🌸 Bloom Token${item.bloomTokenCost === 1 ? '' : 's'}`;
  }
  const price = `${item.cost} 💧`;
  return dewdrops < item.cost ? `${price} · need more` : price;
}
