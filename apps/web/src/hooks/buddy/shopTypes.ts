export type ShopItemCategory =
  | 'HAT'
  | 'TOP'
  | 'SHOES'
  | 'GLASSES'
  | 'HELD_ITEM'
  | 'POT_SKIN'
  | 'BODY_COLOR'
  | 'BODY_PATTERN'
  | 'COMPANION'
  | 'WINGS'
  | 'BACKGROUND'
  | 'FURNITURE';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopItemCategory;
  tier: number;
  cost: number;
  bloomTokenCost?: number;
  seasonalEventId?: string | null;
  requiresPremium: boolean;
  speciesLocked: string | null;
  unlockType: string;
  imageKey: string;
  sortOrder: number;
  owned?: boolean;
  canPurchase?: boolean;
  lockedReason?: 'premium' | 'seasonal' | 'species' | 'level' | 'stage' | 'funds';
  levelRequired?: number;
}

export interface ShopCatalogResponse {
  dewdrops: number;
  bloomTokens: number;
  bloomTokensEnabled: boolean;
  growthStage: string;
  level: number;
  speciesId: string;
  items: ShopItem[];
}

export interface ShopDailyResponse {
  date: string;
  dewdrops: number;
  level?: number;
  items: ShopItem[];
}

export interface ShopInventoryResponse {
  items: ShopItem[];
}

export interface BuddySpeciesOption {
  id: string;
  displayName: string;
  description: string;
  emoji: string;
  unlockType: string;
  unlockValue: number | null;
  unlocked: boolean;
  selected: boolean;
}

export interface BuddySpeciesResponse {
  currentSpeciesId: string;
  species: BuddySpeciesOption[];
}

export const EQUIP_SLOTS = [
  { key: 'hat', label: 'Hat', category: 'HAT' as const },
  { key: 'top', label: 'Top', category: 'TOP' as const },
  { key: 'glasses', label: 'Glasses', category: 'GLASSES' as const },
  { key: 'heldItem', label: 'Held item', category: 'HELD_ITEM' as const },
  { key: 'potSkin', label: 'Pot', category: 'POT_SKIN' as const },
  { key: 'bodyColor', label: 'Color', category: 'BODY_COLOR' as const },
  { key: 'bodyPattern', label: 'Pattern', category: 'BODY_PATTERN' as const },
] as const;
