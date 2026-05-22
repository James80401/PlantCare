import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccessoryPicker from '../../../components/buddy/AccessoryPicker';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import type { ShopItem } from '../../../hooks/buddy/shopTypes';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { shopLockLabel } from '../../../utils/shopLockLabel';

export default function BuddyShopPage() {
  const { catalog, daily, loading, error, purchase, refresh } = useBuddyShop();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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

      <AccessoryPicker
        title="Hats"
        category="HAT"
        items={shopItems}
        dewdrops={catalog.dewdrops}
        showShop
        onEquip={() => {}}
        onPurchase={handlePurchase}
      />
      <AccessoryPicker
        title="Tops"
        category="TOP"
        items={shopItems}
        dewdrops={catalog.dewdrops}
        showShop
        onEquip={() => {}}
        onPurchase={handlePurchase}
      />
      <AccessoryPicker
        title="Pots"
        category="POT_SKIN"
        items={shopItems}
        dewdrops={catalog.dewdrops}
        showShop
        onEquip={() => {}}
        onPurchase={handlePurchase}
      />

      <Link
        to="/garden/buddy/style"
        className="block text-center text-sm font-medium text-emerald-800 hover:underline"
      >
        ← Style hub
      </Link>
    </div>
  );
}
