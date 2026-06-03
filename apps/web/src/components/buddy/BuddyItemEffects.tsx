import type { ShopItem, ShopItemCategory } from '../../hooks/buddy/shopTypes';

export type BuddyItemEffectKind =
  | 'comfort'
  | 'curiosity'
  | 'adventure'
  | 'sunlight'
  | 'dewdrops'
  | 'style'
  | 'focus';

export type BuddyItemEffect = {
  kind: BuddyItemEffectKind;
  label: string;
  value: number;
  description: string;
};

export type BuddyItemEffectSummary = {
  effects: BuddyItemEffect[];
  primary: BuddyItemEffectKind;
  sceneHint: string;
  totalScore: number;
};

const CATEGORY_EFFECTS: Record<ShopItemCategory, BuddyItemEffect> = {
  HAT: {
    kind: 'sunlight',
    label: 'Sun comfort',
    value: 1,
    description: 'More basking, window-watching, and sunny idle moments.',
  },
  TOP: {
    kind: 'comfort',
    label: 'Comfort',
    value: 1,
    description: 'More cozy, calm, and restorative home moments.',
  },
  SHOES: {
    kind: 'adventure',
    label: 'Trail steps',
    value: 1,
    description: 'More travel and wandering moments.',
  },
  GLASSES: {
    kind: 'focus',
    label: 'Focus',
    value: 1,
    description: 'More inspect, scout, and look-around moments.',
  },
  HELD_ITEM: {
    kind: 'curiosity',
    label: 'Curiosity',
    value: 1,
    description: 'More object play and discovery moments.',
  },
  POT_SKIN: {
    kind: 'comfort',
    label: 'Home comfort',
    value: 2,
    description: 'A cozier home with more nap, settle, and room-check moments.',
  },
  BODY_COLOR: {
    kind: 'style',
    label: 'Self expression',
    value: 1,
    description: 'More proud poses and style-forward reactions.',
  },
  BODY_PATTERN: {
    kind: 'style',
    label: 'Personality pop',
    value: 1,
    description: 'More playful reactions and expressive idle moments.',
  },
  COMPANION: {
    kind: 'curiosity',
    label: 'Companion spark',
    value: 2,
    description: 'More social and playful scene moments.',
  },
  WINGS: {
    kind: 'adventure',
    label: 'Adventure lift',
    value: 2,
    description: 'More travel, scout, and discovery moments.',
  },
  BACKGROUND: {
    kind: 'comfort',
    label: 'Room mood',
    value: 1,
    description: 'More scene-specific home behavior.',
  },
  FURNITURE: {
    kind: 'dewdrops',
    label: 'Dewdrop finder',
    value: 1,
    description: 'More treasure, object, and tiny reward moments.',
  },
};

const ITEM_EFFECT_OVERRIDES: Record<string, BuddyItemEffect> = {
  held_watering_can: {
    kind: 'sunlight',
    label: 'Care helper',
    value: 2,
    description: 'Encourages watering and care-themed actions.',
  },
  held_watering_can_gold: {
    kind: 'sunlight',
    label: 'Golden care helper',
    value: 3,
    description: 'Encourages extra bright care-themed actions.',
  },
  held_trowel: {
    kind: 'focus',
    label: 'Soil scout',
    value: 2,
    description: 'Encourages inspecting, digging, and focused checks.',
  },
  held_lantern: {
    kind: 'adventure',
    label: 'Night guide',
    value: 2,
    description: 'Encourages trail-rest, scout, and evening journey moments.',
  },
  held_fireflies: {
    kind: 'adventure',
    label: 'Firefly guide',
    value: 3,
    description: 'Encourages magical travel and discovery moments.',
  },
  glasses_sun: {
    kind: 'sunlight',
    label: 'Bright day ready',
    value: 2,
    description: 'Encourages basking and warm weather moments.',
  },
  glasses_summer_shades: {
    kind: 'sunlight',
    label: 'Summer cool',
    value: 2,
    description: 'Encourages confident sunny reactions.',
  },
  glasses_round: {
    kind: 'focus',
    label: 'Care scholar',
    value: 2,
    description: 'Encourages careful inspection and thoughtful reactions.',
  },
  hat_sun: {
    kind: 'sunlight',
    label: 'Shade smart',
    value: 2,
    description: 'Encourages sunny window watching without overheating.',
  },
  hat_golden_laurel: {
    kind: 'style',
    label: 'Victory glow',
    value: 3,
    description: 'Encourages proud poses and celebration moments.',
  },
  furn_fairy_lights: {
    kind: 'comfort',
    label: 'Cozy glow',
    value: 2,
    description: 'Encourages gentle evening and nap moments.',
  },
  furn_fountain: {
    kind: 'dewdrops',
    label: 'Dew trickle',
    value: 3,
    description: 'Encourages treasure and dewdrop-finding moments.',
  },
  furn_moss_patch: {
    kind: 'comfort',
    label: 'Soft landing',
    value: 2,
    description: 'Encourages cozy wandering and rest.',
  },
  furn_mushroom_cluster: {
    kind: 'curiosity',
    label: 'Woodland wonder',
    value: 2,
    description: 'Encourages curious object play.',
  },
};

const SCENE_HINTS: Record<BuddyItemEffectKind, string> = {
  comfort: 'Cozy items make Buddy nap, settle in, and enjoy home more often.',
  curiosity: 'Curious items make Buddy inspect, play, and notice tiny things.',
  adventure: 'Adventure items make Buddy scout and travel with more confidence.',
  sunlight: 'Sunlight items make Buddy bask, celebrate care, and watch the weather.',
  dewdrops: 'Dewdrop items make Buddy check treasures and seek small rewards.',
  style: 'Style items make Buddy pose, react proudly, and show off.',
  focus: 'Focus items make Buddy inspect, scout, and think before acting.',
};

export function itemEffectFor(item: Pick<ShopItem, 'id' | 'category'>): BuddyItemEffect {
  return ITEM_EFFECT_OVERRIDES[item.id] ?? CATEGORY_EFFECTS[item.category];
}

export function summarizeItemEffects(items: Array<Pick<ShopItem, 'id' | 'category'>>): BuddyItemEffectSummary {
  const merged = new Map<BuddyItemEffectKind, BuddyItemEffect>();

  items.forEach((item) => {
    const effect = itemEffectFor(item);
    const current = merged.get(effect.kind);
    if (!current) {
      merged.set(effect.kind, { ...effect });
      return;
    }
    merged.set(effect.kind, {
      ...current,
      value: current.value + effect.value,
      description: effect.value > current.value ? effect.description : current.description,
    });
  });

  const effects = [...merged.values()].sort((a, b) => b.value - a.value);
  const primary = effects[0]?.kind ?? 'comfort';
  return {
    effects,
    primary,
    sceneHint: SCENE_HINTS[primary],
    totalScore: effects.reduce((sum, effect) => sum + effect.value, 0),
  };
}

export function equippedItemsFromBuddy(
  equipped: Record<string, unknown>,
  inventory: ShopItem[],
): ShopItem[] {
  const equippedIds = new Set(
    Object.values(equipped).filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
  return inventory.filter((item) => equippedIds.has(item.id));
}

export function BuddyItemEffectPills({ effects }: { effects: BuddyItemEffect[] }) {
  if (effects.length === 0) {
    return (
      <p className="text-xs text-gray-500">
        Equip items to unlock mood, home, and adventure behavior bonuses.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {effects.map((effect) => (
        <span
          key={effect.kind}
          className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100"
          title={effect.description}
        >
          {effect.label} +{effect.value}
        </span>
      ))}
    </div>
  );
}

export function BuddyItemEffectCard({ summary }: { summary: BuddyItemEffectSummary }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-emerald-950">Item effects</p>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
          Score {summary.totalScore}
        </span>
      </div>
      <p className="mt-1 text-xs text-emerald-900">{summary.sceneHint}</p>
      <div className="mt-3">
        <BuddyItemEffectPills effects={summary.effects} />
      </div>
    </div>
  );
}
