import { Link } from 'react-router-dom';
import { BuddyActor, BuddyHomeInfoCard, PotHome } from '../../../components/buddy/BuddyItemVisuals';
import {
  BuddyItemEffectCard,
  equippedItemsFromBuddy,
  summarizeItemEffects,
} from '../../../components/buddy/BuddyItemEffects';
import { BuddyPersonalityCard } from '../../../components/buddy/BuddyPersonality';
import { Card } from '../../../components/ui/Card';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useBuddy } from '../../../hooks/buddy/useBuddy';
import { useBuddyShop } from '../../../hooks/buddy/useBuddyShop';

const STYLE_LINKS = [
  { to: 'clothing', label: 'Clothing & accessories', desc: 'Hats, tops, glasses, and more' },
  { to: 'pots', label: 'Homes', desc: 'Choose the little house Buddy lives in' },
  { to: 'terrarium', label: 'Terrarium', desc: 'Backgrounds and furniture' },
  { to: 'species', label: 'Species', desc: 'Switch plant personality' },
  { to: 'shop', label: 'Shop', desc: 'Spend dewdrops on new items' },
] as const;

export default function BuddyStyleHub() {
  const { buddy, loading } = useBuddy();
  const { inventory } = useBuddyShop();

  if (loading || !buddy) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-emerald-700">
        Loading…
      </div>
    );
  }

  const equipped = buddy.equippedItems as Record<string, string>;
  const equippedEffectSummary = summarizeItemEffects(
    equippedItemsFromBuddy(equipped, inventory?.items ?? []),
  );

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <PageHeader
        eyebrow="Style"
        title="Dress up"
        description={`${buddy.dewdrops} dewdrops available`}
      />

      <Card className="flex flex-col items-center gap-2 py-6">
        <div className="flex items-end justify-center gap-2">
          <PotHome itemId={equipped.potSkin} size="sm" />
          <BuddyActor
            speciesId={buddy.speciesId}
            mood={buddy.mood}
            equippedItems={equipped}
            size="lg"
          />
        </div>
        <p className="text-xs text-gray-500">
          {equipped.potSkin ? 'Buddy home equipped' : 'Default Buddy home'}
        </p>
      </Card>

      <BuddyHomeInfoCard itemId={equipped.potSkin} />

      <BuddyPersonalityCard trait={buddy.trait} mode="style" compact />

      <BuddyItemEffectCard summary={equippedEffectSummary} />

      <div className="grid gap-2">
        {STYLE_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="block rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
          >
            <p className="font-semibold text-emerald-950">{link.label}</p>
            <p className="text-sm text-gray-500">{link.desc}</p>
          </Link>
        ))}
      </div>

      <Link
        to="/garden/buddy"
        className="block text-center text-sm font-medium text-emerald-800 hover:underline"
      >
        ← Back to buddy home
      </Link>
    </div>
  );
}
