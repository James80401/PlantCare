import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccessoryPicker from '../../../components/buddy/AccessoryPicker';
import TerrariumView from '../../../components/buddy/TerrariumView';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { buddyApi } from '../../../services/api';

function backgroundShopId(key: string) {
  return key.startsWith('bg_') ? key : `bg_${key}`;
}

function backgroundFromItem(itemId: string) {
  return itemId.startsWith('bg_') ? itemId.slice(3) : itemId;
}

export default function BuddyTerrariumPage() {
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { inventory, catalog, loading } = useBuddyShop();
  const [saving, setSaving] = useState(false);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const items = inventory?.items ?? [];
  const furniture = items.filter((i) => i.category === 'FURNITURE');
  const backgrounds = items.filter((i) => i.category === 'BACKGROUND');
  const layout = (buddy?.terrariumLayout ?? {}) as Record<string, unknown>;

  const setBackground = async (itemId: string) => {
    setSaving(true);
    try {
      await buddyApi.update({ terrariumBackground: backgroundFromItem(itemId) });
      await refreshBuddy();
    } finally {
      setSaving(false);
    }
  };

  const setFurniture = async (slot: string, itemId: string | null) => {
    const next = { ...layout };
    if (itemId) next[slot] = itemId;
    else delete next[slot];
    setSaving(true);
    try {
      await buddyApi.update({ terrariumLayout: next });
      await refreshBuddy();
      setActiveSlot(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !buddy) {
    return <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">Loading…</div>;
  }

  const bgEquipped = backgroundShopId(buddy.terrariumBackground);

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader eyebrow="Style" title="Terrarium" description={saving ? 'Saving…' : 'Decorate your space'} />

      <TerrariumView
        backgroundKey={buddy.terrariumBackground}
        layout={layout}
        furniture={furniture}
        onPlace={(slot) => setActiveSlot(slot)}
      />

      {activeSlot && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="mb-2 text-sm font-medium text-emerald-900">
            Place furniture in &quot;{activeSlot}&quot;
          </p>
          <div className="flex flex-wrap gap-2">
            {furniture.map((f) => (
              <button
                key={f.id}
                type="button"
                className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm"
                onClick={() => setFurniture(activeSlot, f.id)}
              >
                {f.name}
              </button>
            ))}
            <button
              type="button"
              className="rounded-xl px-3 py-1.5 text-xs text-gray-600"
              onClick={() => setFurniture(activeSlot, null)}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <AccessoryPicker
        title="Backgrounds"
        category="BACKGROUND"
        items={backgrounds.length ? backgrounds : (catalog?.items ?? []).filter((i) => i.category === 'BACKGROUND')}
        equippedId={bgEquipped}
        dewdrops={catalog?.dewdrops ?? buddy.dewdrops}
        onEquip={setBackground}
      />

      <Link to="/garden/buddy/style/shop" className="block text-center text-sm text-emerald-800 hover:underline">
        Buy furniture in the shop
      </Link>
      <Link to="/garden/buddy/style" className="block text-center text-sm font-medium text-emerald-800 hover:underline">
        ← Style hub
      </Link>
    </div>
  );
}
