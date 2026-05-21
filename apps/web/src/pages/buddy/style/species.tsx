import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';
import { buddyApi } from '../../../services/api';

export default function BuddySpeciesPage() {
  const { buddy, refresh: refreshBuddy } = useBuddy();
  const { species, loading } = useBuddyShop();
  const [saving, setSaving] = useState<string | null>(null);

  const select = async (speciesId: string) => {
    setSaving(speciesId);
    try {
      await buddyApi.update({ speciesId });
      await refreshBuddy();
    } finally {
      setSaving(null);
    }
  };

  if (loading || !buddy || !species) {
    return <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader eyebrow="Style" title="Species" description="Unlock more by caring consistently" />

      <div className="space-y-2">
        {species.species.map((sp) => (
          <Card
            key={sp.id}
            className={`flex items-center gap-3 ${sp.selected ? 'ring-2 ring-emerald-500' : ''}`}
          >
            <span className="text-3xl" aria-hidden>
              {sp.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-emerald-950">{sp.displayName}</p>
              <p className="text-sm text-gray-600">{sp.description}</p>
              {!sp.unlocked && sp.unlockType === 'STREAK' && (
                <p className="text-xs text-amber-800">
                  Unlock at {sp.unlockValue}-day streak (yours: {buddy.streakDays})
                </p>
              )}
            </div>
            {sp.unlocked ? (
              <Button
                size="sm"
                variant={sp.selected ? 'secondary' : 'primary'}
                disabled={sp.selected || saving === sp.id}
                onClick={() => select(sp.id)}
              >
                {sp.selected ? 'Active' : 'Select'}
              </Button>
            ) : (
              <span className="text-xs font-medium text-gray-400">Locked</span>
            )}
          </Card>
        ))}
      </div>

      <Link to="/garden/buddy/style" className="block text-center text-sm font-medium text-emerald-800 hover:underline">
        ← Style hub
      </Link>
    </div>
  );
}
