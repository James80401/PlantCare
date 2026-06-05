import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { cssClassForAnimation, durationForAnimation } from './buddyCompanionAnimations';
import type { BuddyAnimationDef } from './buddyAnimationCatalog';
import { buildCompanionAnimationRotation } from './buddyCompanionRotation';
import BuddyCharacterModel from './BuddyCharacterModel';
import { faceExpressionForMood, type BuddyFaceExpression } from './buddyFaces';
import type { EquippedItems } from './buddyClothingSvg';
import type { BuddyPhraseContext } from './buddyPhraseContext';

interface BuddyCompanionAnimatedProps {
  speciesId: string;
  size?: 'sm' | 'md';
  traveling?: boolean;
  mood?: string;
  phraseContext?: BuddyPhraseContext | null;
  /** Equipped cosmetics so the persistent companion mirrors the buddy's style. */
  equipped?: EquippedItems | null;
}

const PROP_POSITION_CLASS: Record<NonNullable<BuddyAnimationDef['propPosition']>, string> = {
  'top-left': 'absolute -left-2 -top-2 text-3xl',
  'top-right': 'absolute -right-2 -top-2 text-3xl',
  'bottom-left': 'absolute -left-2 -bottom-2 text-2xl',
  'bottom-right': 'absolute -right-2 -bottom-2 text-2xl',
  top: 'absolute -top-4 left-1/2 -translate-x-1/2 text-2xl',
  left: 'absolute -left-4 top-1/2 -translate-y-1/2 text-3xl',
};

export default function BuddyCompanionAnimated({
  speciesId,
  size = 'sm',
  traveling,
  mood,
  phraseContext,
  equipped,
}: BuddyCompanionAnimatedProps) {
  const rotationKey = `${speciesId}-${phraseContext?.name ?? 'none'}`;
  const actRotation = useMemo(
    () => buildCompanionAnimationRotation(phraseContext ?? null, rotationKey),
    [phraseContext, rotationKey],
  );

  const [actIndex, setActIndex] = useState(0);

  const currentDef = actRotation[actIndex % actRotation.length];

  useEffect(() => {
    setActIndex(0);
  }, [rotationKey]);

  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (traveling || !currentDef || reducedMotion) return;
    const id = window.setTimeout(() => {
      setActIndex((i) => (i + 1) % actRotation.length);
    }, durationForAnimation(currentDef));
    return () => window.clearTimeout(id);
  }, [traveling, actIndex, currentDef, actRotation.length, reducedMotion]);

  const motionClass = traveling ? 'buddy-travel-walk' : cssClassForAnimation(currentDef);
  // Always cheerful — no grey/desaturated neglected state.
  const moodEffect = '';

  const faceExpression: BuddyFaceExpression = useMemo(() => {
    if (traveling) return 'cozy';
    return faceExpressionForMood(mood) ?? currentDef?.face ?? 'happy';
  }, [traveling, mood, currentDef?.face]);

  const propClass = currentDef?.propPosition
    ? PROP_POSITION_CLASS[currentDef.propPosition]
    : PROP_POSITION_CLASS['top-left'];

  const propSecondaryClass = currentDef?.propSecondaryPosition
    ? PROP_POSITION_CLASS[currentDef.propSecondaryPosition]
    : PROP_POSITION_CLASS['top-right'];

  const interactionProps = currentDef?.interaction || Boolean(currentDef?.propSecondary);
  const propAnimClass = interactionProps ? '' : 'buddy-act-prop';

  return (
    <div className="relative flex h-full w-full items-center justify-center" aria-hidden>
      <div className={`${motionClass} ${moodEffect} relative flex items-center justify-center`}>
        <BuddyCharacterModel
          speciesId={speciesId}
          expression={faceExpression}
          size={size === 'sm' ? 'md' : 'lg'}
          variant="companion"
          equipped={equipped}
        />
      </div>

      {!traveling && currentDef?.prop && (
        <span
          className={`${propAnimClass} pointer-events-none ${propClass}`}
          role="img"
          aria-hidden
        >
          {currentDef.prop}
        </span>
      )}
      {!traveling && currentDef?.propSecondary && (
        <span
          className={`buddy-act-prop-secondary pointer-events-none ${propSecondaryClass}`}
          role="img"
          aria-hidden
        >
          {currentDef.propSecondary}
        </span>
      )}
    </div>
  );
}
