import { useState } from 'react';
import { Link } from 'react-router-dom';
import AccessoryPicker from '../../../components/buddy/AccessoryPicker';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { buddyApi } from '../../../services/api';

export default function BuddyPotsPage() {
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { inventory, catalog, loading } = useBuddyShop();
  const [saving, setSaving] = useState(false);

  const items = inventory?.items ?? catalog?.items ?? [];
  const equipped = (buddy?.equippedItems ?? {}) as Record<string, string>;

  const equip = async (itemId: string) => {
    setSaving(true);
    try {
      await buddyApi.update({ equippedItems: { potSkin: itemId } });
      await refreshBuddy();
    } finally {
      setSaving(false);
    }
  };

  if (loading || !buddy) {
    return <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader eyebrow="Style" title="Pots" description={saving ? 'Saving…' : 'Choose a pot skin'} />
      <AccessoryPicker
        title="Pot skins"
        category="POT_SKIN"
        items={items}
        equippedId={equipped.potSkin}
        dewdrops={catalog?.dewdrops ?? buddy.dewdrops}
        onEquip={equip}
      />
      <Link to="/garden/buddy/style/shop" className="block text-center text-sm text-emerald-800 hover:underline">
        Browse shop for more pots
      </Link>
      <Link to="/garden/buddy/style" className="block text-center text-sm font-medium text-emerald-800 hover:underline">
        ← Style hub
      </Link>
    </div>
  );
}
