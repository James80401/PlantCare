import { getAnimationById, type BuddyAnimationDef } from './buddyCompanionAnimations';
import type { BuddyTrait } from '../../hooks/buddy/types';

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
  | 'travel-rest';

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
