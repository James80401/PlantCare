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

const TOP_CLASS: Record<string, string> = {
  top_scarf: 'border-lime-500 bg-lime-300',
  top_overall: 'border-sky-700 bg-sky-400',
  top_spring_cardigan: 'border-pink-500 bg-pink-300',
  top_cozy_scarf: 'border-amber-600 bg-amber-300',
};

const BODY_TINT_CLASS: Record<string, string> = {
  color_monstera_natural: 'bg-emerald-300/20',
  color_cactus_natural: 'bg-lime-300/20',
  color_rose_blush: 'bg-rose-300/25',
  color_succulent_blue: 'bg-sky-300/25',
};

const POT_HOME_THEMES: Record<string, PotTheme> = {
  pot_terra_cotta: {
    body: 'from-orange-300 via-orange-500 to-amber-800',
    rim: 'bg-orange-700',
    roof: 'bg-orange-800',
    door: 'bg-emerald-950',
    window: 'bg-amber-100',
    trim: 'bg-orange-200',
    label: 'Clay pot home',
    shape: 'classic',
  },
  pot_white_ceramic: {
    body: 'from-white via-stone-100 to-emerald-100',
    rim: 'bg-emerald-700',
    roof: 'bg-emerald-800',
    door: 'bg-amber-700',
    window: 'bg-sky-100',
    trim: 'bg-white',
    label: 'Ceramic pot home',
    shape: 'ceramic',
  },
  pot_seagrass: {
    body: 'from-yellow-100 via-lime-500 to-lime-800',
    rim: 'bg-lime-800',
    roof: 'bg-yellow-800',
    door: 'bg-yellow-950',
    window: 'bg-yellow-200',
    trim: 'bg-lime-200',
    label: 'Woven pot home',
    shape: 'woven',
  },
  pot_mason: {
    body: 'from-sky-50 via-sky-200 to-cyan-400',
    rim: 'bg-slate-500',
    roof: 'bg-slate-600',
    door: 'bg-emerald-800',
    window: 'bg-white',
    trim: 'bg-sky-50',
    label: 'Jar pot home',
    shape: 'jar',
  },
  pot_macrame: {
    body: 'from-amber-100 via-orange-200 to-orange-400',
    rim: 'bg-amber-700',
    roof: 'bg-orange-700',
    door: 'bg-emerald-950',
    window: 'bg-orange-50',
    trim: 'bg-amber-100',
    label: 'Hanging pot home',
    shape: 'hanging',
  },
};

function itemId(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function HatVisual({ itemId: hatId }: { itemId: string }) {
  if (hatId.includes('mushroom')) {
    return (
      <div className="relative h-10 w-16">
        <div className="absolute left-1/2 top-1 h-7 w-14 -translate-x-1/2 rounded-t-full bg-red-500 shadow-sm" />
        <span className="absolute left-4 top-3 h-2 w-2 rounded-full bg-white" />
        <span className="absolute right-5 top-2 h-2 w-2 rounded-full bg-white" />
        <span className="absolute left-1/2 bottom-0 h-3 w-8 -translate-x-1/2 rounded-b-lg bg-amber-100" />
      </div>
    );
  }

  if (hatId.includes('beanie') || hatId.includes('knit')) {
    return (
      <div className="relative h-9 w-14">
        <div className="absolute left-1/2 top-2 h-7 w-12 -translate-x-1/2 rounded-t-full bg-emerald-700 shadow-sm" />
        <div className="absolute left-1/2 bottom-0 h-2 w-14 -translate-x-1/2 rounded-full bg-emerald-900" />
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-lime-200" />
      </div>
    );
  }

  if (hatId.includes('laurel') || hatId.includes('wreath') || hatId.includes('flower')) {
    return (
      <div className="relative h-8 w-16">
        <div className="absolute inset-x-1 top-3 h-3 rounded-full border-4 border-lime-500 border-t-lime-300" />
        <span className="absolute left-2 top-1 h-3 w-3 rounded-full bg-pink-300" />
        <span className="absolute right-3 top-0 h-3 w-3 rounded-full bg-yellow-200" />
      </div>
    );
  }

  return (
    <div className="relative h-9 w-16">
      <div className="absolute left-1/2 top-2 h-6 w-11 -translate-x-1/2 rounded-t-full bg-amber-200 shadow-sm" />
      <div className="absolute bottom-1 left-1/2 h-2 w-16 -translate-x-1/2 rounded-full bg-amber-700" />
      <span className="absolute right-3 top-4 h-2 w-5 rounded-full bg-emerald-500" />
    </div>
  );
}

function TopVisual({ itemId: topId }: { itemId: string }) {
  if (topId.includes('scarf')) {
    return (
      <div className="pointer-events-none absolute bottom-14 left-1/2 z-30 h-8 w-20 -translate-x-1/2">
        <div className={`h-4 rounded-full border ${TOP_CLASS[topId] ?? 'border-emerald-500 bg-emerald-300'} shadow-sm`} />
        <div className={`absolute right-4 top-3 h-8 w-3 rounded-full border ${TOP_CLASS[topId] ?? 'border-emerald-500 bg-emerald-300'}`} />
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none absolute bottom-9 left-1/2 z-30 h-10 w-16 -translate-x-1/2 rounded-b-3xl rounded-t-xl border-2 ${
        TOP_CLASS[topId] ?? 'border-emerald-500 bg-emerald-300'
      } shadow-sm ring-2 ring-white/70`}
    >
      <span className="absolute left-3 top-1 h-6 w-1 rounded-full bg-white/45" />
      <span className="absolute right-3 top-1 h-6 w-1 rounded-full bg-white/45" />
    </div>
  );
}

function GlassesVisual({ itemId: glassesId }: { itemId: string }) {
  const dark = glassesId.includes('sun') || glassesId.includes('shades');
  return (
    <div className="pointer-events-none absolute left-1/2 top-[42%] z-40 flex -translate-x-1/2 items-center gap-1">
      <span
        className={`h-5 w-6 rounded-full border-2 border-emerald-950 ${
          dark ? 'bg-emerald-950/80' : 'bg-white/35'
        }`}
      />
      <span className="h-0.5 w-2 bg-emerald-950" />
      <span
        className={`h-5 w-6 rounded-full border-2 border-emerald-950 ${
          dark ? 'bg-emerald-950/80' : 'bg-white/35'
        }`}
      />
    </div>
  );
}

function HeldItemVisual({ itemId: heldId }: { itemId: string }) {
  if (heldId.includes('watering_can')) {
    return (
      <div className="relative h-12 w-12 rotate-12">
        <div className="absolute bottom-2 left-2 h-6 w-7 rounded-lg bg-sky-400 shadow-sm" />
        <div className="absolute bottom-5 right-0 h-2 w-5 rotate-[-22deg] rounded-full bg-sky-500" />
        <div className="absolute bottom-7 left-3 h-3 w-6 rounded-t-full border-2 border-sky-700 border-b-0" />
        <span className="absolute right-0 top-1 h-1 w-1 rounded-full bg-sky-200" />
        <span className="absolute right-3 top-0 h-1 w-1 rounded-full bg-sky-200" />
      </div>
    );
  }

  if (heldId.includes('lantern') || heldId.includes('fireflies')) {
    return (
      <div className="relative h-12 w-10">
        <div className="absolute left-1/2 top-1 h-4 w-5 -translate-x-1/2 rounded-t-full border-2 border-amber-800 border-b-0" />
        <div className="absolute bottom-1 left-1/2 h-8 w-7 -translate-x-1/2 rounded-xl bg-amber-300 shadow-[0_0_22px_rgba(252,211,77,0.8)] ring-2 ring-amber-800" />
        <span className="absolute left-1/2 top-7 h-3 w-3 -translate-x-1/2 rounded-full bg-yellow-100" />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-10 rotate-12">
      <div className="absolute bottom-1 left-4 h-10 w-2 rounded-full bg-amber-800" />
      <div className="absolute top-0 left-1 h-5 w-8 rounded-t-full bg-slate-300 ring-2 ring-slate-600" />
    </div>
  );
}

function PatternOverlay({ itemId: patternId }: { itemId: string }) {
  if (patternId.includes('stripe')) {
    return (
      <div className="pointer-events-none absolute left-1/2 top-[49%] z-20 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full opacity-45">
        <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.75)_0_6px,transparent_6px_13px)]" />
      </div>
    );
  }

  return (
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
  );
}

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
      {bodyPattern && bodyPattern !== 'pattern_none' ? <PatternOverlay itemId={bodyPattern} /> : null}
      <div className={animationClass}>
        <BuddySprite speciesId={speciesId} size={size} traveling={traveling} mood={mood} face={face} />
      </div>
      {top ? <TopVisual itemId={top} /> : null}
      {glasses ? <GlassesVisual itemId={glasses} /> : null}
      {hat ? (
        <div className="pointer-events-none absolute left-1/2 top-1 z-50 -translate-x-1/2 -rotate-6 drop-shadow-sm">
          <HatVisual itemId={hat} />
        </div>
      ) : null}
      {heldItem ? (
        <div className="pointer-events-none absolute bottom-8 right-2 z-50 drop-shadow-sm">
          <HeldItemVisual itemId={heldItem} />
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
      <div className={`absolute left-1/2 top-5 h-5 w-[58%] -translate-x-1/2 rounded-full ${theme.roof} shadow-md`} />
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
