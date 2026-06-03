import { useEffect, useMemo, useState } from 'react';
import { BuddyActor, PotHome, furnitureEmoji } from './BuddyItemVisuals';
import type { BuddyState, BuddyTrait } from '../../hooks/buddy/types';
import type { ShopItem } from '../../hooks/buddy/shopTypes';

type SceneMode = 'home' | 'traveling';

type BuddySceneProps = {
  buddy: BuddyState;
  mode?: SceneMode;
  biomeName?: string;
  biomeEmoji?: string;
  progressPercent?: number;
  remainingLabel?: string;
  furniture?: ShopItem[];
  compact?: boolean;
};

type SceneMoment = {
  id: string;
  label: string;
  className: string;
  reaction?: string;
};

const HOME_MOMENTS: SceneMoment[] = [
  { id: 'idle', label: 'Idle', className: 'translate-x-0', reaction: 'hmm' },
  { id: 'peek', label: 'Peeking inside', className: '-translate-x-10', reaction: 'cozy' },
  { id: 'treasure', label: 'Checking treasures', className: 'translate-x-8', reaction: 'ooh' },
  { id: 'nap', label: 'Napping by the door', className: '-translate-x-2 translate-y-1', reaction: 'zzz' },
  { id: 'stretch', label: 'Tiny stretch', className: 'translate-x-0 -translate-y-2', reaction: 'ahh' },
];

const TRAVEL_MOMENTS: SceneMoment[] = [
  { id: 'trail', label: 'Exploring trail', className: '-translate-x-8', reaction: 'go!' },
  { id: 'found', label: 'Found something', className: 'translate-x-4 -translate-y-1', reaction: '!' },
  { id: 'light', label: 'Following light', className: 'translate-x-10', reaction: 'sun' },
];

const TRAIT_REACTIONS: Record<BuddyTrait, string[]> = {
  RESILIENT: ['I got this', 'ta-da', 'again!'],
  SUN_SEEKER: ['sunny!', 'beam!', 'more light'],
  NIGHT_BLOOMER: ['hehe', 'softly', 'moon glow'],
  WILD: ['whee!', 'zoom!', 'boing'],
  TENDER: ['aww', 'thank you', 'happy'],
};

const BACKGROUND_CLASS: Record<string, string> = {
  sunny_windowsill: 'from-sky-200 via-lime-100 to-emerald-300',
  greenhouse: 'from-emerald-200 via-lime-100 to-teal-300',
  moonlit_porch: 'from-indigo-300 via-slate-200 to-emerald-300',
  rainy_greenhouse: 'from-slate-300 via-sky-100 to-emerald-300',
  seed_garden: 'from-sky-200 via-lime-100 to-emerald-300',
  forest_floor: 'from-emerald-800 via-lime-300 to-amber-200',
  desert_oasis: 'from-orange-200 via-yellow-100 to-cyan-200',
};

function sceneBackground(key: string) {
  return BACKGROUND_CLASS[key] ?? BACKGROUND_CLASS.sunny_windowsill;
}

function displayFurniture(layout: Record<string, unknown>, furniture: ShopItem[]) {
  return Object.entries(layout)
    .map(([slot, rawId]) => {
      const itemId = typeof rawId === 'string' ? rawId : null;
      if (!itemId) return null;
      return {
        slot,
        itemId,
        item: furniture.find((item) => item.id === itemId),
      };
    })
    .filter(Boolean) as { slot: string; itemId: string; item?: ShopItem }[];
}

export default function BuddyScene({
  buddy,
  mode = buddy.hasActiveJourney ? 'traveling' : 'home',
  biomeName,
  biomeEmoji,
  progressPercent,
  remainingLabel,
  furniture = [],
  compact,
}: BuddySceneProps) {
  const [momentIndex, setMomentIndex] = useState(0);
  const [pokeReaction, setPokeReaction] = useState<string | null>(null);
  const equipped = (buddy.equippedItems ?? {}) as Record<string, unknown>;
  const layout = (buddy.terrariumLayout ?? {}) as Record<string, unknown>;
  const sceneKey = mode === 'traveling' ? buddy.currentBiome : buddy.terrariumBackground;
  const moments = mode === 'traveling' ? TRAVEL_MOMENTS : HOME_MOMENTS;
  const moment = moments[momentIndex % moments.length];
  const placedFurniture = useMemo(() => displayFurniture(layout, furniture), [layout, furniture]);
  const heightClass = compact ? 'min-h-[18rem]' : 'min-h-[26rem]';

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setMomentIndex((index) => index + 1);
    }, mode === 'traveling' ? 4200 : 3600);
    return () => window.clearInterval(id);
  }, [mode]);

  useEffect(() => {
    if (!pokeReaction) return;
    const id = window.setTimeout(() => setPokeReaction(null), 1600);
    return () => window.clearTimeout(id);
  }, [pokeReaction]);

  const poke = () => {
    const pool = TRAIT_REACTIONS[buddy.trait] ?? TRAIT_REACTIONS.RESILIENT;
    setPokeReaction(pool[Math.floor(Math.random() * pool.length)]);
  };

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-b ${sceneBackground(
        sceneKey,
      )} ${heightClass} shadow-xl shadow-emerald-950/10`}
      aria-label={mode === 'traveling' ? 'Buddy travel scene' : 'Buddy home scene'}
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-white/30" />
      <div className="absolute left-7 top-8 h-16 w-16 rounded-full bg-yellow-200/80 shadow-[0_0_45px_rgba(253,224,71,0.65)]" />
      <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-emerald-700/25" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-emerald-900/10" />
      <div className="absolute bottom-11 left-1/2 h-10 w-52 -translate-x-1/2 rounded-[50%] bg-amber-100/45 blur-sm" />
      <div className="absolute bottom-16 left-[34%] h-3 w-8 rotate-[-8deg] rounded-full bg-white/40" />
      <div className="absolute bottom-20 left-[55%] h-3 w-10 rotate-[10deg] rounded-full bg-white/40" />
      <div className="absolute right-10 top-28 h-2 w-2 rounded-full bg-yellow-100 shadow-[0_0_14px_rgba(254,240,138,.9)]" />
      <div className="absolute right-20 top-44 h-1.5 w-1.5 rounded-full bg-yellow-100 shadow-[0_0_12px_rgba(254,240,138,.85)]" />

      {mode === 'traveling' ? (
        <>
          <div className="absolute right-8 top-8 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-emerald-950 shadow-sm">
            <span aria-hidden>{biomeEmoji ?? '🌿'} </span>
            {biomeName ?? 'Exploring'}
          </div>
          <div className="absolute bottom-24 left-8 right-8 h-2 overflow-hidden rounded-full bg-white/60">
            <div
              className="h-full rounded-full bg-emerald-700 transition-all duration-700"
              style={{ width: `${progressPercent ?? 0}%` }}
            />
          </div>
          {remainingLabel ? (
            <p className="absolute bottom-28 left-8 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-900">
              {remainingLabel}
            </p>
          ) : null}
        </>
      ) : (
        <>
          <PotHome
            itemId={typeof equipped.potSkin === 'string' ? equipped.potSkin : null}
            size={compact ? 'md' : 'lg'}
            open={moment.id === 'peek' || moment.id === 'nap'}
            className="absolute bottom-14 left-5 sm:left-10"
          />
          {moment.id === 'treasure' ? (
            <div className="absolute bottom-14 left-[58%] z-20 h-12 w-14 rounded-2xl bg-amber-200 shadow-md ring-2 ring-amber-700/40">
              <div className="absolute -top-2 left-1/2 h-5 w-10 -translate-x-1/2 rounded-t-full bg-amber-300 ring-2 ring-amber-700/30" />
              <span className="absolute left-3 top-4 h-2 w-2 rounded-full bg-emerald-500" />
              <span className="absolute right-4 top-5 h-2 w-2 rounded-full bg-rose-400" />
            </div>
          ) : null}
          {moment.id === 'nap' ? (
            <div className="absolute bottom-16 left-[26%] z-20 h-8 w-20 rounded-full bg-white/70 shadow-sm">
              <span className="absolute right-4 top-2 text-xs font-bold text-emerald-900">zzz</span>
            </div>
          ) : null}
          {placedFurniture.map(({ slot, itemId, item }, index) => (
            <div
              key={`${slot}-${itemId}`}
              className={`absolute bottom-12 z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/50 text-3xl shadow-sm ${
                index === 0 ? 'right-8' : index === 1 ? 'right-28' : 'right-48'
              }`}
              title={item?.name ?? itemId}
            >
              {furnitureEmoji(itemId)}
            </div>
          ))}
        </>
      )}

      <button
        type="button"
        onClick={poke}
        className={`absolute bottom-10 left-1/2 z-30 -translate-x-1/2 transition duration-700 ${
          moment.className
        } focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80`}
        aria-label={`Poke ${buddy.name}`}
      >
        <BuddyActor
          speciesId={buddy.speciesId}
          mood={buddy.mood}
          traveling={mode === 'traveling'}
          equippedItems={equipped}
          size={compact ? 'md' : 'lg'}
          reaction={pokeReaction ?? moment.reaction}
        />
      </button>

      <div className="absolute left-5 top-5 max-w-[72%] rounded-3xl bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {mode === 'traveling' ? 'Out in the world' : 'At home'}
        </p>
        <p className="mt-0.5 text-lg font-bold text-emerald-950">{buddy.name}</p>
        <p className="mt-1 text-xs text-gray-600">
          {mode === 'traveling'
            ? moment.label
            : `${moment.label} in their pot-home`}
        </p>
      </div>
    </section>
  );
}
