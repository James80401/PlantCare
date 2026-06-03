import BuddySprite from './BuddySprite';
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
};

type PotHomeProps = {
  itemId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  open?: boolean;
  className?: string;
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

const HAT_VISUALS: Record<string, string> = {
  hat_sun: '👒',
  hat_flower_daisy: '🌼',
  hat_golden_laurel: '🌿',
  hat_mushroom: '🍄',
  hat_garden_wide: '👒',
  hat_beanie: '🧢',
  hat_spring_wreath: '🌸',
  hat_autumn_beret: '🍂',
  hat_knit_beanie: '🧶',
};

const HELD_VISUALS: Record<string, string> = {
  held_watering_can: '💧',
  held_trowel: '🛠',
  held_lantern: '🏮',
  held_fireflies: '✨',
  held_watering_can_gold: '🌟',
};

const GLASSES_VISUALS: Record<string, string> = {
  glasses_round: '⌾',
  glasses_sun: '😎',
  glasses_summer_shades: '🕶',
};

const TOP_CLASS: Record<string, string> = {
  top_scarf: 'bg-lime-300',
  top_overall: 'bg-sky-400',
  top_spring_cardigan: 'bg-pink-300',
  top_cozy_scarf: 'bg-amber-300',
};

const BODY_TINT_CLASS: Record<string, string> = {
  color_monstera_natural: 'bg-emerald-300/20',
  color_cactus_natural: 'bg-lime-300/20',
  color_rose_blush: 'bg-rose-300/25',
  color_succulent_blue: 'bg-sky-300/25',
};

const POT_HOME_THEMES: Record<
  string,
  {
    body: string;
    roof: string;
    door: string;
    accent: string;
    label: string;
  }
> = {
  pot_terra_cotta: {
    body: 'from-orange-300 to-amber-700',
    roof: 'bg-orange-700',
    door: 'bg-emerald-900',
    accent: 'bg-amber-100',
    label: 'Clay pot home',
  },
  pot_white_ceramic: {
    body: 'from-stone-50 to-emerald-100',
    roof: 'bg-emerald-700',
    door: 'bg-amber-600',
    accent: 'bg-sky-100',
    label: 'Ceramic pot home',
  },
  pot_seagrass: {
    body: 'from-yellow-100 to-lime-700',
    roof: 'bg-lime-800',
    door: 'bg-yellow-900',
    accent: 'bg-yellow-200',
    label: 'Woven pot home',
  },
  pot_mason: {
    body: 'from-sky-50 to-sky-300',
    roof: 'bg-slate-500',
    door: 'bg-emerald-800',
    accent: 'bg-white',
    label: 'Jar pot home',
  },
  pot_macrame: {
    body: 'from-amber-100 to-orange-300',
    roof: 'bg-amber-700',
    door: 'bg-emerald-900',
    accent: 'bg-orange-50',
    label: 'Hanging pot home',
  },
};

function itemId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function BuddyActor({
  speciesId,
  mood,
  traveling,
  equippedItems,
  size = 'lg',
  reaction,
  className = '',
}: BuddyActorProps) {
  const hat = itemId(equippedItems?.hat);
  const top = itemId(equippedItems?.top);
  const glasses = itemId(equippedItems?.glasses);
  const heldItem = itemId(equippedItems?.heldItem);
  const bodyColor = itemId(equippedItems?.bodyColor);
  const bodyPattern = itemId(equippedItems?.bodyPattern);
  const wrapperSize = size === 'lg' ? 'h-44 w-44' : 'h-32 w-32';

  return (
    <div className={`relative ${wrapperSize} ${className}`} aria-label="Plant Buddy">
      {bodyColor ? (
        <div
          className={`pointer-events-none absolute left-1/2 top-[42%] z-10 h-20 w-20 -translate-x-1/2 rounded-full ${
            BODY_TINT_CLASS[bodyColor] ?? 'bg-emerald-300/20'
          } mix-blend-multiply`}
        />
      ) : null}
      {bodyPattern && bodyPattern !== 'pattern_none' ? (
        <div className="pointer-events-none absolute left-1/2 top-[50%] z-20 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full opacity-60">
          <div className="grid h-full w-full grid-cols-3 gap-2 p-3">
            <span className="rounded-full bg-white/70" />
            <span className="rounded-full bg-white/40" />
            <span className="rounded-full bg-white/70" />
            <span className="rounded-full bg-white/40" />
            <span className="rounded-full bg-white/70" />
            <span className="rounded-full bg-white/40" />
          </div>
        </div>
      ) : null}
      <BuddySprite speciesId={speciesId} size={size} traveling={traveling} mood={mood} />
      {top ? (
        <div
          className={`pointer-events-none absolute bottom-9 left-1/2 z-30 h-9 w-16 -translate-x-1/2 rounded-b-3xl rounded-t-xl ${
            TOP_CLASS[top] ?? 'bg-emerald-300'
          } shadow-sm ring-2 ring-white/70`}
        />
      ) : null}
      {glasses ? (
        <div className="pointer-events-none absolute left-1/2 top-[42%] z-40 flex -translate-x-1/2 items-center gap-1 text-xl font-black text-emerald-950">
          {GLASSES_VISUALS[glasses] === '😎' || GLASSES_VISUALS[glasses] === '🕶' ? (
            <span>{GLASSES_VISUALS[glasses]}</span>
          ) : (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-emerald-950 bg-white/30" />
              <span className="h-0.5 w-2 bg-emerald-950" />
              <span className="h-4 w-4 rounded-full border-2 border-emerald-950 bg-white/30" />
            </>
          )}
        </div>
      ) : null}
      {hat ? (
        <div className="pointer-events-none absolute left-1/2 top-1 z-50 -translate-x-1/2 -rotate-6 text-4xl drop-shadow-sm">
          {HAT_VISUALS[hat] ?? '🎩'}
        </div>
      ) : null}
      {heldItem ? (
        <div className="pointer-events-none absolute bottom-10 right-4 z-50 rotate-12 text-3xl drop-shadow-sm">
          {HELD_VISUALS[heldItem] ?? '✨'}
        </div>
      ) : null}
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
    size === 'lg' ? 'h-36 w-40' : size === 'sm' ? 'h-20 w-24' : 'h-28 w-32';

  return (
    <div className={`relative ${sizeClass} ${className}`} aria-label={theme.label}>
      <div className={`absolute left-1/2 top-0 h-6 w-16 -translate-x-1/2 rounded-t-full ${theme.roof}`} />
      <div className={`absolute inset-x-3 bottom-0 h-[78%] rounded-b-[2rem] rounded-t-xl bg-gradient-to-b ${theme.body} shadow-xl ring-2 ring-white/50`} />
      <div className={`absolute left-1/2 top-[42%] h-9 w-6 -translate-x-1/2 rounded-t-full ${theme.door} shadow-inner`}>
        {open ? <span className="absolute inset-1 rounded-t-full bg-yellow-200/80" /> : null}
      </div>
      <div className={`absolute left-[22%] top-[35%] h-5 w-5 rounded-full ${theme.accent} shadow-inner`} />
      <div className={`absolute right-[22%] top-[35%] h-5 w-5 rounded-full ${theme.accent} shadow-inner`} />
      <div className="absolute left-1/2 top-2 h-14 w-0.5 -translate-x-1/2 bg-white/60" />
      <div className="absolute -bottom-1 left-1/2 h-3 w-24 -translate-x-1/2 rounded-full bg-emerald-950/15" />
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
