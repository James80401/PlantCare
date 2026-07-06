import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useInterval } from '../../hooks/useInterval';
import { BuddyActor, PotHome, furnitureEmoji } from './BuddyItemVisuals';
import { EncounterFigure, TravelLandmarks, biomeVisual } from './BuddyJourneyWorld';
import {
  SceneActionEffect,
  actionRotationForEffect,
  animationForAction,
  buddyInteractionItemIds,
  reactionForTrait,
} from './BuddySceneActions';
import type { BuddyItemEffectSummary } from './BuddyItemEffects';
import type { BuddyState, BuddyTrait } from '../../hooks/buddy/types';
import type { ShopItem } from '../../hooks/buddy/shopTypes';
import { personalityForTrait } from './BuddyPersonality';
import { buddyBackgroundAccent, buddyBackgroundClass } from './buddyBackgrounds';
import { SceneBackdrop, SceneForeground } from './BuddySceneBackdrop';
import { BuddyRoomInterior } from './BuddyRoomInterior';

type SceneMode = 'home' | 'traveling';

type BuddySceneProps = {
  buddy: BuddyState;
  mode?: SceneMode;
  biomeName?: string;
  biomeEmoji?: string;
  progressPercent?: number;
  remainingLabel?: string;
  furniture?: ShopItem[];
  itemEffects?: BuddyItemEffectSummary | null;
  compact?: boolean;
};

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
  itemEffects,
  compact,
}: BuddySceneProps) {
  const [actionIndex, setActionIndex] = useState(0);
  const [pokeReaction, setPokeReaction] = useState<{
    reaction: string;
    animationId: string;
    label: string;
  } | null>(null);
  const equipped = (buddy.equippedItems ?? {}) as Record<string, unknown>;
  const layout = (buddy.terrariumLayout ?? {}) as Record<string, unknown>;
  const sceneKey = mode === 'traveling' ? buddy.currentBiome : buddy.terrariumBackground;
  const travelVisual = biomeVisual(sceneKey);
  const background = mode === 'traveling' ? travelVisual.sky : buddyBackgroundClass(sceneKey);
  const backgroundAccent = buddyBackgroundAccent(sceneKey);
  const personality = personalityForTrait(buddy.trait);
  const placedFurniture = useMemo(() => displayFurniture(layout, furniture), [layout, furniture]);
  const interactionItemIds = useMemo(
    () => buddyInteractionItemIds(equipped, layout),
    [equipped, layout],
  );
  const actions = actionRotationForEffect(
    mode,
    itemEffects?.primary,
    buddy.trait,
    interactionItemIds,
  );
  const scheduledAction = actions[actionIndex % actions.length];
  const activeAction = pokeReaction
    ? {
        ...scheduledAction,
        id: scheduledAction.id,
        label: pokeReaction.label,
        caption: 'reacting to your tap',
        animationId: pokeReaction.animationId,
        reaction: pokeReaction.reaction,
        effect: 'sparkles' as const,
      }
    : scheduledAction;
  const activeAnimation = animationForAction(activeAction);
  const heightClass = compact ? 'min-h-[18rem]' : 'min-h-[26rem]';
  const reducedMotion = useReducedMotion();
  // Home defaults to the cozy interior of the buddy's house; tap the little house
  // to step outside and see it (and the chosen background) from the garden.
  const [view, setView] = useState<'interior' | 'exterior'>('interior');
  const interior = mode === 'home' && view === 'interior';

  useInterval(
    () => setActionIndex((index) => index + 1),
    mode === 'traveling' ? 4200 : 3600,
    !reducedMotion,
  );

  useEffect(() => {
    if (!pokeReaction) return;
    const id = window.setTimeout(() => setPokeReaction(null), 1600);
    return () => window.clearTimeout(id);
  }, [pokeReaction]);

  const poke = () => {
    setPokeReaction(reactionForTrait(buddy.trait as BuddyTrait));
  };

  return (
    <section
      className={`relative isolate overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-b ${background} ${heightClass} shadow-xl shadow-emerald-950/10`}
      aria-label={mode === 'traveling' ? 'Buddy travel scene' : 'Buddy home scene'}
    >
      {!interior ? (
        <>
          <div className="absolute inset-x-0 top-0 h-24 bg-white/25" />
          {mode === 'home' ? <SceneBackdrop accent={backgroundAccent} /> : null}
          <div className="absolute bottom-0 left-0 right-0 h-28 rounded-t-[50%] bg-emerald-800/20" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-emerald-950/10" />
          <div className="absolute bottom-8 left-[56%] h-9 w-44 -translate-x-1/2 rounded-[50%] bg-amber-100/45 blur-sm" />
        </>
      ) : null}

      {mode === 'traveling' ? (
        <>
          <TravelLandmarks biomeId={sceneKey} />
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
          <EncounterFigure
            biomeId={sceneKey}
            size={compact ? 'sm' : 'md'}
            className="absolute bottom-16 right-8 z-20"
          />
          <div className="absolute left-6 bottom-16 rounded-2xl bg-white/75 px-3 py-2 text-xs font-semibold text-emerald-950 shadow-sm">
            {travelVisual.landmark}
          </div>
        </>
      ) : interior ? (
        <BuddyRoomInterior
          backgroundKey={sceneKey}
          accent={backgroundAccent}
          placedFurniture={placedFurniture}
          compact={compact}
        />
      ) : (
        <>
          <PotHome
            itemId={typeof equipped.potSkin === 'string' ? equipped.potSkin : null}
            size={compact ? 'md' : 'lg'}
            open={activeAction.id === 'inspect-home' || activeAction.id === 'nap'}
            className="absolute bottom-14 left-[40%] z-10 -translate-x-1/2"
          />
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
          <SceneForeground />
        </>
      )}

      <SceneActionEffect action={activeAction} compact={compact} />

      <button
        type="button"
        onClick={poke}
        className={`absolute z-30 -translate-x-1/2 transition duration-700 ${
          interior ? 'bottom-8 left-1/2' : 'bottom-7 left-[56%]'
        } ${activeAction.className} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80`}
        aria-label={`Poke ${buddy.name}`}
      >
        <BuddyActor
          speciesId={buddy.speciesId}
          mood={buddy.mood}
          traveling={mode === 'traveling'}
          equippedItems={equipped}
          size={compact ? 'md' : 'lg'}
          reaction={activeAction.reaction}
          animationClass={activeAnimation.cssClass}
          face={activeAnimation.face}
        />
      </button>

      {mode === 'home' ? (
        <button
          type="button"
          onClick={() => setView(interior ? 'exterior' : 'interior')}
          className="absolute right-4 top-4 z-40 flex items-center gap-1.5 rounded-2xl bg-white/85 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label={interior ? "See your buddy's house from outside" : 'Go back inside the house'}
        >
          {interior ? (
            <>
              <span className="relative block h-10 w-12 overflow-hidden rounded-lg bg-sky-100 ring-1 ring-emerald-100">
                <span className="absolute left-1/2 top-1 block origin-top -translate-x-1/2 scale-[0.4]">
                  <PotHome
                    itemId={typeof equipped.potSkin === 'string' ? equipped.potSkin : null}
                    size="sm"
                  />
                </span>
              </span>
              Outside
            </>
          ) : (
            <>
              <span aria-hidden className="text-base">🏠</span>
              Inside
            </>
          )}
        </button>
      ) : null}

      <div className="absolute left-5 top-5 max-w-[72%] rounded-3xl bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          {mode === 'traveling' ? 'Out in the world' : interior ? 'Cozy at home' : 'Out in the garden'}
        </p>
        <p className="mt-0.5 text-lg font-bold text-emerald-950">{buddy.name}</p>
        <p className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-800">
          {personality.label} mood
        </p>
        <p className="mt-1 text-xs text-gray-600">{activeAction.caption}</p>
      </div>
      <div className="absolute bottom-5 right-5 max-w-[46%] rounded-2xl bg-emerald-950/70 px-3 py-2 text-right text-xs font-semibold text-white shadow-sm backdrop-blur">
        Now: {activeAction.label}
        <span className="mt-0.5 block text-[0.68rem] font-medium text-emerald-100">
          {mode === 'traveling' ? personality.choiceTone : `${personality.label} reaction`}
        </span>
        {itemEffects && itemEffects.totalScore > 0 ? (
          <span className="mt-0.5 block text-[0.68rem] font-medium text-emerald-100">
            Item boost: {itemEffects.effects[0]?.label}
          </span>
        ) : null}
      </div>
    </section>
  );
}
