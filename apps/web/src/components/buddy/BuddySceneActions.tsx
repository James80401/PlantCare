import { getAnimationById, type BuddyAnimationDef } from './buddyCompanionAnimations';
import type { BuddyItemEffectKind } from './BuddyItemEffects';
import type { BuddyTrait } from '../../hooks/buddy/types';
import { personalityForTrait } from './BuddyPersonality';

export type SceneActionId =
  | 'idle'
  | 'wander'
  | 'inspect-home'
  | 'nap'
  | 'treasure'
  | 'weather-watch'
  | 'object-play'
  | 'celebrate'
  | 'travel-walk'
  | 'travel-scout'
  | 'travel-find'
  | 'travel-rest'
  | 'water-practice'
  | 'soil-dig'
  | 'lantern-glow'
  | 'firefly-chase'
  | 'shades-pose'
  | 'scholar-inspect'
  | 'cozy-snuggle'
  | 'home-swing'
  | 'fountain-sip'
  | 'mushroom-game'
  | 'moss-roll'
  | 'light-twinkle'
  | 'pebble-balance'
  | 'flower-twirl'
  | 'travel-lantern-scout'
  | 'travel-firefly-trail'
  | 'travel-trowel-map'
  | 'travel-water-share'
  | 'travel-shades-lookout'
  | 'travel-cozy-rest';

export type SceneAction = {
  id: SceneActionId;
  label: string;
  caption: string;
  className: string;
  animationId: string;
  reaction: string;
  effect?: 'sparkles' | 'zzz' | 'weather' | 'treasure' | 'footprints' | 'inspect' | 'travel';
};

type PokeReaction = {
  label: string;
  animationId: string;
  reaction: string;
};

export type BuddyItemInteraction = {
  itemIds: string[];
  actionIds: SceneActionId[];
  label: string;
  description: string;
};

export const HOME_ACTIONS: SceneAction[] = [
  {
    id: 'idle',
    label: 'Idle wiggle',
    caption: 'settling into the room',
    className: 'translate-x-0',
    animationId: 'sway-slow',
    reaction: 'hmm',
  },
  {
    id: 'wander',
    label: 'Wander',
    caption: 'padding around their home',
    className: '-translate-x-12',
    animationId: 'side-step',
    reaction: 'step',
    effect: 'footprints',
  },
  {
    id: 'inspect-home',
    label: 'Home check',
    caption: 'checking the door and windows',
    className: '-translate-x-8',
    animationId: 'check-soil',
    reaction: 'looks good',
    effect: 'inspect',
  },
  {
    id: 'object-play',
    label: 'Play',
    caption: 'playing with a favorite thing',
    className: 'translate-x-10 -translate-y-1',
    animationId: 'seed-friend',
    reaction: 'mine',
    effect: 'sparkles',
  },
  {
    id: 'treasure',
    label: 'Treasure check',
    caption: 'counting tiny treasures',
    className: 'translate-x-8',
    animationId: 'shop-browse',
    reaction: 'ooh',
    effect: 'treasure',
  },
  {
    id: 'weather-watch',
    label: 'Window watch',
    caption: 'watching the light outside',
    className: 'translate-x-2 -translate-y-2',
    animationId: 'sun-bask',
    reaction: 'sunny',
    effect: 'weather',
  },
  {
    id: 'nap',
    label: 'Nap',
    caption: 'dozing by the door',
    className: '-translate-x-2 translate-y-1',
    animationId: 'snooze',
    reaction: 'zzz',
    effect: 'zzz',
  },
  {
    id: 'celebrate',
    label: 'Tiny cheer',
    caption: 'celebrating today\'s care',
    className: 'translate-x-0 -translate-y-2',
    animationId: 'clap',
    reaction: 'yay',
    effect: 'sparkles',
  },
];

export const TRAVEL_ACTIONS: SceneAction[] = [
  {
    id: 'travel-walk',
    label: 'Trail walk',
    caption: 'following the little path',
    className: '-translate-x-10',
    animationId: 'march',
    reaction: 'go',
    effect: 'travel',
  },
  {
    id: 'travel-scout',
    label: 'Scout',
    caption: 'looking for a safe route',
    className: 'translate-x-4 -translate-y-1',
    animationId: 'look-around',
    reaction: 'hmm',
    effect: 'inspect',
  },
  {
    id: 'travel-find',
    label: 'Discovery',
    caption: 'spotting something shiny',
    className: 'translate-x-12 -translate-y-2',
    animationId: 'surprised',
    reaction: '!',
    effect: 'sparkles',
  },
  {
    id: 'travel-rest',
    label: 'Trail rest',
    caption: 'resting before the next bend',
    className: '-translate-x-2 translate-y-1',
    animationId: 'sigh-happy',
    reaction: 'whew',
    effect: 'zzz',
  },
];

const HOME_ITEM_ACTIONS: SceneAction[] = [
  {
    id: 'water-practice',
    label: 'Water practice',
    caption: 'practicing careful tiny pours',
    className: 'translate-x-9 -translate-y-1',
    animationId: 'water-can',
    reaction: 'drip',
    effect: 'weather',
  },
  {
    id: 'soil-dig',
    label: 'Soil scout',
    caption: 'checking the best little digging spot',
    className: '-translate-x-9',
    animationId: 'seed-plant',
    reaction: 'dig',
    effect: 'inspect',
  },
  {
    id: 'lantern-glow',
    label: 'Lantern glow',
    caption: 'making the room feel warm and safe',
    className: 'translate-x-5 -translate-y-2',
    animationId: 'star-gaze',
    reaction: 'glow',
    effect: 'sparkles',
  },
  {
    id: 'firefly-chase',
    label: 'Firefly chase',
    caption: 'following soft floating lights',
    className: 'translate-x-12 -translate-y-3',
    animationId: 'flutter',
    reaction: 'twinkle',
    effect: 'sparkles',
  },
  {
    id: 'shades-pose',
    label: 'Shades pose',
    caption: 'showing off the cool look',
    className: 'translate-x-3 -translate-y-2',
    animationId: 'cool-shades',
    reaction: 'cool',
    effect: 'sparkles',
  },
  {
    id: 'scholar-inspect',
    label: 'Care scholar',
    caption: 'studying every tiny detail',
    className: '-translate-x-7 -translate-y-1',
    animationId: 'thinking-hard',
    reaction: 'noted',
    effect: 'inspect',
  },
  {
    id: 'cozy-snuggle',
    label: 'Cozy snuggle',
    caption: 'bundling up for a soft rest',
    className: '-translate-x-2 translate-y-1',
    animationId: 'cozy-blanket',
    reaction: 'cozy',
    effect: 'zzz',
  },
  {
    id: 'home-swing',
    label: 'Home swing',
    caption: 'swaying happily near their home',
    className: '-translate-x-10 -translate-y-1',
    animationId: 'sway-slow',
    reaction: 'sway',
    effect: 'footprints',
  },
  {
    id: 'fountain-sip',
    label: 'Fountain sip',
    caption: 'listening to the little water trickle',
    className: 'translate-x-10',
    animationId: 'dew-collect',
    reaction: 'sip',
    effect: 'treasure',
  },
  {
    id: 'mushroom-game',
    label: 'Mushroom game',
    caption: 'inventing rules around the mushrooms',
    className: 'translate-x-11 -translate-y-2',
    animationId: 'hide-seek',
    reaction: 'peek',
    effect: 'sparkles',
  },
  {
    id: 'moss-roll',
    label: 'Moss roll',
    caption: 'flopping into the soft moss',
    className: '-translate-x-8 translate-y-1',
    animationId: 'content-sigh',
    reaction: 'soft',
    effect: 'zzz',
  },
  {
    id: 'light-twinkle',
    label: 'Light twinkle',
    caption: 'watching the fairy lights blink',
    className: 'translate-x-4 -translate-y-3',
    animationId: 'lightbulb',
    reaction: 'blink',
    effect: 'sparkles',
  },
  {
    id: 'pebble-balance',
    label: 'Pebble balance',
    caption: 'balancing on the smooth pebble',
    className: 'translate-x-8 -translate-y-1',
    animationId: 'wobble',
    reaction: 'steady',
    effect: 'footprints',
  },
  {
    id: 'flower-twirl',
    label: 'Flower twirl',
    caption: 'twirling under the flowers',
    className: 'translate-x-2 -translate-y-2',
    animationId: 'bloom',
    reaction: 'bloom',
    effect: 'sparkles',
  },
];

const TRAVEL_ITEM_ACTIONS: SceneAction[] = [
  {
    id: 'travel-lantern-scout',
    label: 'Lantern scout',
    caption: 'lighting the safest path',
    className: '-translate-x-6 -translate-y-1',
    animationId: 'star-gaze',
    reaction: 'this way',
    effect: 'inspect',
  },
  {
    id: 'travel-firefly-trail',
    label: 'Firefly trail',
    caption: 'following twinkles between leaves',
    className: 'translate-x-10 -translate-y-3',
    animationId: 'flutter',
    reaction: 'shine',
    effect: 'sparkles',
  },
  {
    id: 'travel-trowel-map',
    label: 'Trail map',
    caption: 'marking a tiny route in the soil',
    className: '-translate-x-9',
    animationId: 'journal-scribble',
    reaction: 'mapped',
    effect: 'inspect',
  },
  {
    id: 'travel-water-share',
    label: 'Water share',
    caption: 'saving a sip for a dry spot',
    className: 'translate-x-8 -translate-y-1',
    animationId: 'water-splash',
    reaction: 'share',
    effect: 'weather',
  },
  {
    id: 'travel-shades-lookout',
    label: 'Sunny lookout',
    caption: 'checking the bright route ahead',
    className: 'translate-x-4 -translate-y-2',
    animationId: 'cool-shades',
    reaction: 'clear',
    effect: 'travel',
  },
  {
    id: 'travel-cozy-rest',
    label: 'Cozy trail rest',
    caption: 'taking a soft pause before moving on',
    className: '-translate-x-2 translate-y-1',
    animationId: 'cozy-blanket',
    reaction: 'rest',
    effect: 'zzz',
  },
];

const HOME_EFFECT_ACTIONS: Record<BuddyItemEffectKind, SceneActionId[]> = {
  comfort: ['nap', 'inspect-home', 'idle'],
  curiosity: ['object-play', 'inspect-home', 'treasure'],
  adventure: ['wander', 'weather-watch', 'object-play'],
  sunlight: ['weather-watch', 'celebrate', 'wander'],
  dewdrops: ['treasure', 'object-play', 'inspect-home'],
  style: ['celebrate', 'object-play', 'idle'],
  focus: ['inspect-home', 'weather-watch', 'treasure'],
};

const TRAVEL_EFFECT_ACTIONS: Record<BuddyItemEffectKind, SceneActionId[]> = {
  comfort: ['travel-rest', 'travel-scout'],
  curiosity: ['travel-find', 'travel-scout'],
  adventure: ['travel-walk', 'travel-scout', 'travel-find'],
  sunlight: ['travel-walk', 'travel-find'],
  dewdrops: ['travel-find', 'travel-scout'],
  style: ['travel-find', 'travel-walk'],
  focus: ['travel-scout', 'travel-find'],
};

export const ITEM_INTERACTIONS: BuddyItemInteraction[] = [
  {
    itemIds: ['held_watering_can', 'held_watering_can_gold'],
    actionIds: ['water-practice', 'travel-water-share'],
    label: 'Care practice',
    description: 'Buddy practices tiny pours at home and shares water on journeys.',
  },
  {
    itemIds: ['held_trowel'],
    actionIds: ['soil-dig', 'travel-trowel-map'],
    label: 'Soil scouting',
    description: 'Buddy digs, checks soil, and marks little trail routes.',
  },
  {
    itemIds: ['held_lantern'],
    actionIds: ['lantern-glow', 'travel-lantern-scout'],
    label: 'Lantern guide',
    description: 'Buddy lights the room at home and scouts safer paths while traveling.',
  },
  {
    itemIds: ['held_fireflies'],
    actionIds: ['firefly-chase', 'travel-firefly-trail'],
    label: 'Firefly friend',
    description: 'Buddy chases twinkles at home and follows them out in the world.',
  },
  {
    itemIds: ['glasses_sun', 'glasses_summer_shades'],
    actionIds: ['shades-pose', 'travel-shades-lookout'],
    label: 'Sunny lookout',
    description: 'Buddy poses confidently and checks bright travel routes.',
  },
  {
    itemIds: ['glasses_round'],
    actionIds: ['scholar-inspect'],
    label: 'Care scholar',
    description: 'Buddy pauses to study the scene with extra focus.',
  },
  {
    itemIds: ['top_scarf', 'top_cozy_scarf', 'top_spring_cardigan', 'top_rose_petals'],
    actionIds: ['cozy-snuggle', 'travel-cozy-rest'],
    label: 'Cozy layer',
    description: 'Buddy takes softer rests and snuggly pauses.',
  },
  {
    itemIds: ['pot_macrame'],
    actionIds: ['home-swing'],
    label: 'Swinging home',
    description: 'Buddy sways around the hanging home.',
  },
  {
    itemIds: ['furn_fountain'],
    actionIds: ['fountain-sip'],
    label: 'Fountain sip',
    description: 'Buddy listens to the water and collects dewdrops.',
  },
  {
    itemIds: ['furn_mushroom_cluster'],
    actionIds: ['mushroom-game'],
    label: 'Mushroom game',
    description: 'Buddy turns the mushroom cluster into a tiny game.',
  },
  {
    itemIds: ['furn_moss_patch'],
    actionIds: ['moss-roll'],
    label: 'Moss rest',
    description: 'Buddy flops into the soft moss for cozy breaks.',
  },
  {
    itemIds: ['furn_fairy_lights', 'furn_string_lights'],
    actionIds: ['light-twinkle'],
    label: 'Twinkle watch',
    description: 'Buddy watches room lights blink and glow.',
  },
  {
    itemIds: ['furn_pebble'],
    actionIds: ['pebble-balance'],
    label: 'Pebble balance',
    description: 'Buddy practices balancing on the smooth pebble.',
  },
  {
    itemIds: ['hat_flower_daisy', 'hat_spring_wreath', 'hat_rose_crown'],
    actionIds: ['flower-twirl'],
    label: 'Flower flourish',
    description: 'Buddy twirls and blooms when wearing floral headwear.',
  },
];

function itemActionIdsFor(mode: 'home' | 'traveling', itemIds: string[] = []): SceneActionId[] {
  if (itemIds.length === 0) return [];
  const equipped = new Set(itemIds);
  return ITEM_INTERACTIONS.filter((interaction) =>
    interaction.itemIds.some((itemId) => equipped.has(itemId)),
  ).flatMap((interaction) =>
    interaction.actionIds.filter((id) =>
      mode === 'traveling' ? id.startsWith('travel-') : !id.startsWith('travel-'),
    ),
  );
}

export function activeItemInteractions(itemIds: string[] = []): BuddyItemInteraction[] {
  if (itemIds.length === 0) return [];
  const equipped = new Set(itemIds);
  return ITEM_INTERACTIONS.filter((interaction) =>
    interaction.itemIds.some((itemId) => equipped.has(itemId)),
  );
}

export function buddyInteractionItemIds(
  equippedItems: Record<string, unknown> = {},
  terrariumLayout: Record<string, unknown> = {},
): string[] {
  return [
    ...Object.values(equippedItems),
    ...Object.values(terrariumLayout),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);
}

export function BuddyItemInteractionCard({
  itemIds,
  compact,
}: {
  itemIds: string[];
  compact?: boolean;
}) {
  const interactions = activeItemInteractions(itemIds);

  if (interactions.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white/85 px-4 py-3">
        <p className="text-sm font-bold text-emerald-950">Living item interactions</p>
        <p className="mt-1 text-xs text-gray-500">
          Equip held items, cozy clothes, glasses, special homes, or place furniture to unlock unique Buddy actions.
        </p>
      </div>
    );
  }

  const visible = compact ? interactions.slice(0, 3) : interactions;

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/90 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-emerald-950">Living item interactions</p>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900">
          {interactions.length} active
        </span>
      </div>
      <div className="mt-3 grid gap-2">
        {visible.map((interaction) => (
          <div key={interaction.label} className="rounded-xl bg-emerald-50 px-3 py-2">
            <p className="text-xs font-bold text-emerald-950">{interaction.label}</p>
            <p className="mt-0.5 text-xs text-emerald-900">{interaction.description}</p>
          </div>
        ))}
      </div>
      {compact && interactions.length > visible.length ? (
        <p className="mt-2 text-xs font-medium text-emerald-800">
          +{interactions.length - visible.length} more from your current setup
        </p>
      ) : null}
    </div>
  );
}

const POKE_REACTIONS: Record<BuddyTrait, PokeReaction[]> = {
  RESILIENT: [
    { label: 'Proud pop', animationId: 'proud-stand', reaction: 'ta-da' },
    { label: 'Determined', animationId: 'determined', reaction: 'ready' },
    { label: 'High five', animationId: 'high-five', reaction: 'again' },
  ],
  SUN_SEEKER: [
    { label: 'Sun bask', animationId: 'sunbeam', reaction: 'beam' },
    { label: 'Joy jump', animationId: 'jump-joy', reaction: 'sunny' },
    { label: 'Photosynthesis', animationId: 'photosynthesis', reaction: 'glow' },
  ],
  NIGHT_BLOOMER: [
    { label: 'Star gaze', animationId: 'star-gaze', reaction: 'softly' },
    { label: 'Moon sway', animationId: 'sway-slow', reaction: 'moon' },
    { label: 'Shy giggle', animationId: 'hide-seek', reaction: 'hehe' },
  ],
  WILD: [
    { label: 'Zoom', animationId: 'zoom', reaction: 'zoom' },
    { label: 'Cartwheel', animationId: 'cartwheel', reaction: 'whee' },
    { label: 'Wiggle', animationId: 'wiggle', reaction: 'boing' },
  ],
  TENDER: [
    { label: 'Love', animationId: 'hug', reaction: 'aww' },
    { label: 'Happy sigh', animationId: 'sigh-happy', reaction: 'thanks' },
    { label: 'Bloom', animationId: 'bloom', reaction: 'happy' },
  ],
};

export function animationForAction(action: Pick<SceneAction, 'animationId'>): BuddyAnimationDef {
  return getAnimationById(action.animationId) ?? getAnimationById('bob')!;
}

export function reactionForTrait(trait: BuddyTrait): PokeReaction {
  const pool = POKE_REACTIONS[trait] ?? POKE_REACTIONS.RESILIENT;
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
}

export function actionRotationForEffect(
  mode: 'home' | 'traveling',
  primaryEffect?: BuddyItemEffectKind,
  trait?: BuddyTrait,
  itemIds: string[] = [],
): SceneAction[] {
  const base =
    mode === 'traveling'
      ? [...TRAVEL_ACTIONS, ...TRAVEL_ITEM_ACTIONS]
      : [...HOME_ACTIONS, ...HOME_ITEM_ACTIONS];
  const personality = personalityForTrait(trait);
  const traitPreferredIds =
    mode === 'traveling'
      ? personality.preferredTravelActions
      : personality.preferredHomeActions;

  const effectPreferredIds = primaryEffect
    ? mode === 'traveling'
      ? TRAVEL_EFFECT_ACTIONS[primaryEffect]
      : HOME_EFFECT_ACTIONS[primaryEffect]
    : [];
  const itemPreferredIds = itemActionIdsFor(mode, itemIds);
  const preferredIds = [...new Set([...itemPreferredIds, ...traitPreferredIds, ...effectPreferredIds])];
  if (preferredIds.length === 0) return base;

  const preferred = preferredIds
    .map((id) => base.find((action) => action.id === id))
    .filter(Boolean) as SceneAction[];
  const rest = base.filter((action) => !preferredIds.includes(action.id));
  return [...preferred, ...rest];
}

export function SceneActionEffect({ action, compact }: { action: SceneAction; compact?: boolean }) {
  if (!action.effect) return null;

  if (action.effect === 'zzz') {
    return (
      <div className="absolute bottom-28 left-[24%] z-20 flex gap-1 text-xs font-bold text-emerald-950/70">
        <span className="translate-y-2">z</span>
        <span>z</span>
        <span className="-translate-y-2">z</span>
      </div>
    );
  }

  if (action.effect === 'sparkles') {
    return (
      <div className="pointer-events-none absolute inset-x-10 top-20 z-20 flex justify-between">
        <span className="h-3 w-3 rounded-full bg-yellow-100 shadow-[0_0_18px_rgba(254,240,138,.95)]" />
        <span className="mt-10 h-2 w-2 rounded-full bg-white shadow-[0_0_16px_rgba(255,255,255,.9)]" />
        <span className="h-4 w-4 rounded-full bg-lime-100 shadow-[0_0_20px_rgba(217,249,157,.95)]" />
      </div>
    );
  }

  if (action.effect === 'weather') {
    return (
      <div className="absolute right-10 top-16 z-10 rounded-full bg-white/55 px-4 py-2 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="h-5 w-8 rounded-full bg-white/90" />
          <span className="h-8 w-8 rounded-full bg-yellow-200/80 shadow-[0_0_24px_rgba(253,224,71,.75)]" />
        </div>
      </div>
    );
  }

  if (action.effect === 'treasure') {
    return (
      <div className="absolute bottom-14 left-[58%] z-20 h-12 w-14 rounded-2xl bg-amber-200 shadow-md ring-2 ring-amber-700/40">
        <div className="absolute -top-2 left-1/2 h-5 w-10 -translate-x-1/2 rounded-t-full bg-amber-300 ring-2 ring-amber-700/30" />
        <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-emerald-500" />
        <span className="absolute right-4 top-5 h-2 w-2 rounded-full bg-rose-400" />
      </div>
    );
  }

  if (action.effect === 'inspect') {
    return (
      <div className="absolute bottom-24 right-16 z-20 h-12 w-12 rounded-full border-4 border-white/80 bg-sky-100/40 shadow-sm">
        <span className="absolute -bottom-4 right-0 h-5 w-1.5 rotate-[-35deg] rounded-full bg-white/80" />
      </div>
    );
  }

  const footprintSize = compact ? 'h-1.5 w-3' : 'h-2 w-4';
  return (
    <div className="absolute bottom-14 left-20 right-20 z-10 flex justify-center gap-4 opacity-45">
      <span className={`${footprintSize} rotate-12 rounded-full bg-emerald-950/40`} />
      <span className={`${footprintSize} -rotate-12 rounded-full bg-emerald-950/35`} />
      <span className={`${footprintSize} rotate-12 rounded-full bg-emerald-950/30`} />
    </div>
  );
}
