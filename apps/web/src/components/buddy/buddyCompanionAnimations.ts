import { BUDDY_LIVE_ANIMATIONS, type BuddyAnimationDef } from './buddyAnimationCatalog';

export type { BuddyAnimationDef };
export {
  BUDDY_ANIMATION_CATALOG,
  BUDDY_LIVE_ANIMATIONS,
  BUDDY_PLANNED_ANIMATIONS,
  getAnimationById,
} from './buddyAnimationCatalog';

/** Default ms per animation before advancing (overridable per entry). */
/** Shorter slot so the full catalog cycles in reasonable time (~5 min at ~114 acts). */
export const BUDDY_ACT_DURATION_MS = 2_800;

export const BUDDY_COMPANION_ACTS = BUDDY_LIVE_ANIMATIONS;

export function cssClassForAnimation(def: BuddyAnimationDef): string {
  return def.status === 'live' ? def.cssClass : 'buddy-act-bob';
}

export function durationForAnimation(def: BuddyAnimationDef): number {
  return def.durationMs ?? BUDDY_ACT_DURATION_MS;
}
