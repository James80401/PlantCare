import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccessoryPicker from '../../../components/buddy/AccessoryPicker';
import BuddySprite from '../../../components/buddy/BuddySprite';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { EQUIP_SLOTS } from '../../../hooks/buddy/shopTypes';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { buddyApi } from '../../../services/api';

export default function BuddyClothingPage() {
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { inventory, catalog, loading } = useBuddyShop();
  const [saving, setSaving] = useState(false);

  const items = inventory?.items ?? catalog?.items ?? [];
  const equipped = (buddy?.equippedItems ?? {}) as Record<string, string>;
  const dewdrops = catalog?.dewdrops ?? buddy?.dewdrops ?? 0;

  const equip = async (slot: string, itemId: string) => {
    if (!buddy) return;
    setSaving(true);
    try {
      await buddyApi.update({ equippedItems: { [slot]: itemId } });
      await refreshBuddy();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !buddy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading…
      </div>
    );
  }

  const clothingSlots = EQUIP_SLOTS.filter((s) =>
    ['HAT', 'TOP', 'GLASSES', 'HELD_ITEM', 'BODY_COLOR', 'BODY_PATTERN'].includes(s.category),
  );

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader eyebrow="Style" title="Clothing" description={saving ? 'Saving…' : 'Tap owned items to equip'} />

      <Card className="flex justify-center py-4">
        <BuddySprite speciesId={buddy.speciesId} size="md" />
      </Card>

      {clothingSlots.map((slot) => (
        <AccessoryPicker
          key={slot.key}
          title={slot.label}
          category={slot.category}
          items={items}
          equippedId={equipped[slot.key]}
          dewdrops={dewdrops}
          onEquip={(itemId) => equip(slot.key, itemId)}
        />
      ))}

      <Link to="/garden/buddy/style" className="block text-center text-sm font-medium text-emerald-800 hover:underline">
        ← Style hub
      </Link>
    </div>
  );
}
