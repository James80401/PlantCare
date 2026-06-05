import BuddySprite from './BuddySprite';
import type { BuddyFaceExpression } from './buddyFaces';
import type { ShopItem, ShopItemCategory } from '../../hooks/buddy/shopTypes';

type EquippedItems = Record<string, unknown>;

type BuddyActorProps = {
  speciesId: string;
  mood?: string;
  traveling?: boolean;
  equippedItems?: EquippedItems | null;
  size?: 'md' | 'lg';
  reaction?: string | null;
  className?: string;
  animationClass?: string;
  face?: BuddyFaceExpression;
};

type PotHomeProps = {
  itemId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  open?: boolean;
  className?: string;
};

type PotTheme = {
  body: string;
  rim: string;
  roof: string;
  door: string;
  window: string;
  trim: string;
  label: string;
  subtitle: string;
  bonus: string;
  shape: 'classic' | 'ceramic' | 'woven' | 'jar' | 'hanging';
};

const SLOT_BY_CATEGORY: Partial<Record<ShopItemCategory, string>> = {
  HAT: 'hat',
  TOP: 'top',
  GLASSES: 'glasses',
  HELD_ITEM: 'heldItem',
  POT_SKIN: 'potSkin',
  BODY_COLOR: 'bodyColor',
  BODY_PATTERN: 'bodyPattern',
};

const POT_HOME_THEMES: Record<string, PotTheme> = {
  pot_terra_cotta: {
    body: 'from-orange-300 via-orange-500 to-amber-800',
    rim: 'bg-orange-700',
    roof: 'bg-orange-800',
    door: 'bg-emerald-950',
    window: 'bg-amber-100',
    trim: 'bg-orange-200',
    label: 'Clay Cottage',
    subtitle: 'Warm starter home',
    bonus: 'Balanced comfort for everyday idle moments.',
    shape: 'classic',
  },
  pot_white_ceramic: {
    body: 'from-white via-stone-100 to-emerald-100',
    rim: 'bg-emerald-700',
    roof: 'bg-emerald-800',
    door: 'bg-amber-700',
    window: 'bg-sky-100',
    trim: 'bg-white',
    label: 'Ceramic Studio',
    subtitle: 'Bright tidy home',
    bonus: 'Encourages calm inspection and focused home checks.',
    shape: 'ceramic',
  },
  pot_seagrass: {
    body: 'from-yellow-100 via-lime-500 to-lime-800',
    rim: 'bg-lime-800',
    roof: 'bg-yellow-800',
    door: 'bg-yellow-950',
    window: 'bg-yellow-200',
    trim: 'bg-lime-200',
    label: 'Seagrass Burrow',
    subtitle: 'Soft woven nest',
    bonus: 'Encourages cozy wandering and restorative naps.',
    shape: 'woven',
  },
  pot_mason: {
    body: 'from-sky-50 via-sky-200 to-cyan-400',
    rim: 'bg-slate-500',
    roof: 'bg-slate-600',
    door: 'bg-emerald-800',
    window: 'bg-white',
    trim: 'bg-sky-50',
    label: 'Glass Jar Loft',
    subtitle: 'Sparkly little lookout',
    bonus: 'Encourages curiosity, weather watching, and light play.',
    shape: 'jar',
  },
  pot_macrame: {
    body: 'from-amber-100 via-orange-200 to-orange-400',
    rim: 'bg-amber-700',
    roof: 'bg-orange-700',
    door: 'bg-emerald-950',
    window: 'bg-orange-50',
    trim: 'bg-amber-100',
    label: 'Hanging Haven',
    subtitle: 'Swinging sky home',
    bonus: 'Encourages playful movement and adventure-ready moods.',
    shape: 'hanging',
  },
};

export function BuddyActor({
  speciesId,
  mood,
  traveling,
  equippedItems,
  size = 'lg',
  reaction,
  className = '',
  animationClass = '',
  face,
}: BuddyActorProps) {
  const wrapperSize = size === 'lg' ? 'h-44 w-44' : 'h-32 w-32';

  return (
    <div
      className={`relative flex items-center justify-center ${wrapperSize} ${className}`}
      aria-label="Plant Buddy"
    >
      {/* Cosmetics are drawn as SVG layers inside the character's viewBox
          (see buddyClothingSvg), so they stay anchored to the head/eyes/body
          and bob with the idle animation. */}
      <div className={animationClass}>
        <BuddySprite
          speciesId={speciesId}
          size={size}
          traveling={traveling}
          mood={mood}
          face={face}
          equipped={equippedItems}
        />
      </div>
      {reaction ? (
        <div className="pointer-events-none absolute -right-2 top-3 z-50 rounded-full bg-white/95 px-3 py-1 text-sm font-semibold text-emerald-900 shadow-lg">
          {reaction}
        </div>
      ) : null}
    </div>
  );
}

export function PotHome({ itemId: rawItemId, size = 'md', open, className = '' }: PotHomeProps) {
  const theme = POT_HOME_THEMES[rawItemId ?? ''] ?? POT_HOME_THEMES.pot_terra_cotta;
  const sizeClass =
    size === 'lg' ? 'h-40 w-44' : size === 'sm' ? 'h-24 w-28' : 'h-32 w-36';
  const shellShape =
    theme.shape === 'jar'
      ? 'rounded-b-[2.5rem] rounded-t-xl'
      : theme.shape === 'woven'
        ? 'rounded-b-[2rem] rounded-t-[1.75rem]'
        : 'rounded-b-[2.25rem] rounded-t-xl';

  return (
    <div className={`relative ${sizeClass} ${className}`} aria-label={theme.label}>
      {theme.shape === 'hanging' ? (
        <>
          <div className="absolute left-1/2 top-0 h-20 w-0.5 -translate-x-1/2 bg-amber-100/80" />
          <div className="absolute left-[30%] top-3 h-16 w-0.5 rotate-[-16deg] bg-amber-100/80" />
          <div className="absolute right-[30%] top-3 h-16 w-0.5 rotate-[16deg] bg-amber-100/80" />
        </>
      ) : null}
      <div className="absolute left-1/2 top-1 h-6 w-10 -translate-x-1/2 rounded-t-full bg-white/35" />
      <div className={`absolute left-1/2 top-5 h-5 w-[58%] -translate-x-1/2 rounded-full ${theme.roof} shadow-md`} />
      <div className={`absolute left-1/2 top-2 h-8 w-[48%] -translate-x-1/2 rounded-t-[2rem] ${theme.roof} shadow-md`} />
      <div className={`absolute inset-x-3 bottom-2 h-[76%] ${shellShape} bg-gradient-to-b ${theme.body} shadow-xl ring-2 ring-white/50`} />
      <div className={`absolute left-1/2 top-[24%] h-4 w-[72%] -translate-x-1/2 rounded-full ${theme.rim} shadow-sm`} />
      <div className={`absolute left-1/2 top-[47%] h-11 w-8 -translate-x-1/2 rounded-t-full ${theme.door} shadow-inner ring-2 ring-white/30`}>
        {open ? <span className="absolute inset-1 rounded-t-full bg-yellow-200/85 shadow-[0_0_18px_rgba(254,240,138,0.9)]" /> : null}
        <span className="absolute right-1 top-5 h-1.5 w-1.5 rounded-full bg-yellow-200" />
      </div>
      <div className={`absolute left-[22%] top-[40%] h-6 w-6 rounded-full ${theme.window} shadow-inner ring-2 ring-white/70`}>
        <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-emerald-950/20" />
        <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-emerald-950/20" />
      </div>
      <div className={`absolute right-[22%] top-[40%] h-6 w-6 rounded-full ${theme.window} shadow-inner ring-2 ring-white/70`}>
        <span className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-emerald-950/20" />
        <span className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-emerald-950/20" />
      </div>
      {theme.shape === 'woven' ? (
        <div className="absolute inset-x-6 bottom-9 h-16 opacity-40">
          <div className="h-full w-full bg-[repeating-linear-gradient(35deg,rgba(255,255,255,.8)_0_3px,transparent_3px_9px)]" />
        </div>
      ) : null}
      {theme.shape === 'jar' ? (
        <div className="absolute left-7 top-11 h-20 w-2 rounded-full bg-white/45" />
      ) : null}
      <div className={`absolute left-1/2 bottom-0 h-3 w-16 -translate-x-1/2 rounded-t-full ${theme.trim}`} />
      <div className="absolute left-1/2 -bottom-1 h-3 w-28 -translate-x-1/2 rounded-full bg-emerald-950/15" />
    </div>
  );
}

export function potHomeInfo(itemId?: string | null) {
  const theme = POT_HOME_THEMES[itemId ?? ''] ?? POT_HOME_THEMES.pot_terra_cotta;
  return {
    id: itemId ?? 'pot_terra_cotta',
    label: theme.label,
    subtitle: theme.subtitle,
    bonus: theme.bonus,
    shape: theme.shape,
  };
}

export function BuddyHomeInfoCard({ itemId }: { itemId?: string | null }) {
  const home = potHomeInfo(itemId);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3 text-left shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Current home</p>
      <p className="mt-1 text-lg font-bold text-emerald-950">{home.label}</p>
      <p className="text-sm text-gray-600">{home.subtitle}</p>
      <p className="mt-2 text-xs font-medium text-emerald-800">{home.bonus}</p>
    </div>
  );
}

export function ShopItemPreview({ item }: { item: ShopItem }) {
  const slot = SLOT_BY_CATEGORY[item.category];
  const equipped = slot ? { [slot]: item.id } : {};

  if (item.category === 'POT_SKIN') {
    return <PotHome itemId={item.id} size="sm" />;
  }

  if (item.category === 'BACKGROUND') {
    return (
      <div className="h-20 w-24 overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-lime-100 to-emerald-300 shadow-inner">
        <div className="mt-8 h-12 rounded-t-full bg-white/35" />
      </div>
    );
  }

  if (item.category === 'FURNITURE') {
    return (
      <div className="flex h-20 w-24 items-center justify-center rounded-2xl bg-amber-50 text-3xl shadow-inner">
        {furnitureEmoji(item.id)}
      </div>
    );
  }

  return (
    <div className="flex h-20 w-24 items-center justify-center rounded-2xl bg-emerald-50 shadow-inner">
      <BuddyActor speciesId={item.speciesLocked ?? 'monstera'} equippedItems={equipped} size="md" />
    </div>
  );
}

export function furnitureEmoji(itemId: string): string {
  if (itemId.includes('lantern') || itemId.includes('lights')) return '🏮';
  if (itemId.includes('pumpkin')) return '🎃';
  if (itemId.includes('mushroom')) return '🍄';
  if (itemId.includes('bench')) return '🪑';
  if (itemId.includes('planter')) return '🪴';
  return '🌿';
}
