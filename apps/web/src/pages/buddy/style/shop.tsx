import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AccessoryPicker from '../../../components/buddy/AccessoryPicker';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EQUIP_SLOTS } from '../../../hooks/buddy/shopTypes';
import type { ShopItem, ShopItemCategory } from '../../../hooks/buddy/shopTypes';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { buddyApi } from '../../../services/api';
import { shopLockLabel } from '../../../utils/shopLockLabel';

const SHOP_SECTIONS: { title: string; category: ShopItemCategory }[] = [
  { title: 'Hats', category: 'HAT' },
  { title: 'Tops', category: 'TOP' },
  { title: 'Glasses', category: 'GLASSES' },
  { title: 'Held items', category: 'HELD_ITEM' },
  { title: 'Homes', category: 'POT_SKIN' },
  { title: 'Colors', category: 'BODY_COLOR' },
  { title: 'Patterns', category: 'BODY_PATTERN' },
  { title: 'Backgrounds', category: 'BACKGROUND' },
  { title: 'Furniture', category: 'FURNITURE' },
];

const SLOT_BY_CATEGORY: Partial<Record<ShopItemCategory, string>> = Object.fromEntries(
  EQUIP_SLOTS.map((slot) => [slot.category, slot.key]),
);

function backgroundFromItem(itemId: string) {
  return itemId.startsWith('bg_') ? itemId.slice(3) : itemId;
}

function backgroundShopId(key: string) {
  return key.startsWith('bg_') ? key : `bg_${key}`;
}

export default function BuddyShopPage() {
  const navigate = useNavigate();
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { catalog, daily, loading, error, purchase, refresh } = useBuddyShop();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const equipped = (buddy?.equippedItems ?? {}) as Record<string, string>;

  const equippedIdFor = (category: ShopItemCategory): string | undefined => {
    if (category === 'BACKGROUND') return buddy ? backgroundShopId(buddy.terrariumBackground) : undefined;
    const slot = SLOT_BY_CATEGORY[category];
    return slot ? equipped[slot] : undefined;
  };

  const handleEquip = async (category: ShopItemCategory, itemId: string) => {
    if (category === 'FURNITURE') {
      navigate('/garden/buddy/style/terrarium');
      return;
    }
    if (category === 'BACKGROUND') {
      await buddyApi.update({ terrariumBackground: backgroundFromItem(itemId) });
      await refreshBuddy();
      return;
    }
    const slot = SLOT_BY_CATEGORY[category];
    if (!slot) return;
    await buddyApi.update({ equippedItems: { [slot]: itemId } });
    await refreshBuddy();
  };

  const priceLabel = (item: ShopItem) => {
    if (item.bloomTokenCost && item.bloomTokenCost > 0) {
      return `${item.bloomTokenCost} Bloom Token${item.bloomTokenCost === 1 ? '' : 's'}`;
    }
    return `${item.cost} dewdrops`;
  };

  const handlePurchase = async (item: ShopItem) => {
    if (!window.confirm(`Buy "${item.name}" for ${priceLabel(item)}?`)) return;
    setBusyId(item.id);
    setMessage('');
    try {
      await purchase(item.id);
      setMessage(`Purchased ${item.name}!`);
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'response' in e
          ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message)
          : 'Purchase failed';
      setMessage(msg || 'Purchase failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading shop…
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <p className="text-red-700">{error || 'Shop unavailable'}</p>
        <Button onClick={() => refresh()}>Retry</Button>
      </div>
    );
  }

  const shopItems = catalog.items.map((i) => ({
    ...i,
    owned: i.owned,
    canPurchase: i.canPurchase,
  }));

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Shop"
        title="Dewdrop market"
        description={
          catalog.bloomTokensEnabled
            ? `Balance: ${catalog.dewdrops} 💧 · ${catalog.bloomTokens} 🌸 Bloom Tokens`
            : `Balance: ${catalog.dewdrops} 💧`
        }
      />

      <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
        Buddy level {catalog.level} unlocks higher-tier shop items as you earn XP.
      </p>

      {daily && daily.items.length > 0 && (
        <Card className="space-y-3 border-amber-200 bg-amber-50/80">
          <p className="text-sm font-semibold text-amber-950">Today&apos;s picks</p>
          <ul className="space-y-2 text-sm">
            {daily.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <span>
                  {item.name}
                  {item.owned
                    ? ' (owned)'
                    : item.canPurchase
                      ? ` — ${priceLabel(item)}`
                      : ` — ${shopLockLabel(item, catalog.dewdrops)}`}
                </span>
                {!item.owned && item.canPurchase && (
                  <Button
                    size="sm"
                    disabled={busyId === item.id}
                    onClick={() => handlePurchase(item)}
                  >
                    Buy
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {message && <p className="text-center text-sm text-emerald-800">{message}</p>}

      {SHOP_SECTIONS.map((section) => (
        <AccessoryPicker
          key={section.category}
          title={section.title}
          category={section.category}
          items={shopItems}
          equippedId={equippedIdFor(section.category)}
          dewdrops={catalog.dewdrops}
          showShop
          onEquip={(itemId) => handleEquip(section.category, itemId)}
          onPurchase={handlePurchase}
        />
      ))}

      <Link
        to="/garden/buddy/style"
        className="block text-center text-sm font-medium text-emerald-800 hover:underline"
      >
        ← Style hub
      </Link>
    </div>
  );
}
