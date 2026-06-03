import type { ShopItem, ShopItemCategory } from '../../hooks/buddy/shopTypes';
import { shopLockLabel } from '../../utils/shopLockLabel';
import { ShopItemPreview } from './BuddyItemVisuals';

interface AccessoryPickerProps {
  title: string;
  category: ShopItemCategory;
  items: ShopItem[];
  equippedId?: string;
  dewdrops: number;
  onEquip: (itemId: string) => void;
  onPurchase?: (item: ShopItem) => void;
  showShop?: boolean;
}

const categoryEmoji: Partial<Record<ShopItemCategory, string>> = {
  HAT: '🎩',
  TOP: '👕',
  GLASSES: '👓',
  HELD_ITEM: '🪴',
  POT_SKIN: '🏺',
  BODY_COLOR: '🎨',
  BODY_PATTERN: '✨',
  BACKGROUND: '🖼️',
  FURNITURE: '🪑',
};

export default function AccessoryPicker({
  title,
  category,
  items,
  equippedId,
  dewdrops,
  onEquip,
  onPurchase,
  showShop = false,
}: AccessoryPickerProps) {
  const filtered = items.filter((i) => i.category === category);
  if (filtered.length === 0) {
    return (
      <p className="text-sm text-gray-500">No items in this category yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-emerald-900">
        {categoryEmoji[category]} {title}
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {filtered.map((item) => {
          const owned = item.owned ?? true;
          const selected = equippedId === item.id;
          const canBuy = showShop && !owned && item.canPurchase;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (owned) onEquip(item.id);
                else if (canBuy && onPurchase) onPurchase(item);
              }}
              disabled={!owned && !canBuy}
              className={`rounded-2xl border p-3 text-left text-sm transition ${
                selected
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-400'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              } ${!owned && !canBuy ? 'opacity-50' : ''}`}
            >
              <div className="mb-2 flex justify-center">
                <ShopItemPreview item={item} />
              </div>
              <p className="font-semibold text-emerald-950">{item.name}</p>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
              {owned ? (
                <p className="mt-2 text-xs font-medium text-emerald-700">
                  {selected ? 'Equipped' : 'Tap to equip'}
                </p>
              ) : canBuy ? (
                <p className="mt-2 text-xs font-medium text-amber-800">{shopLockLabel(item, dewdrops)}</p>
              ) : (
                <p
                  className={`mt-2 text-xs font-medium ${
                    item.lockedReason === 'premium' ? 'text-violet-800' : 'text-gray-600'
                  }`}
                >
                  {shopLockLabel(item, dewdrops)}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
