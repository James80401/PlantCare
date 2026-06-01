import {
  BUDDY_COMPANION_MODES,
  type BuddyCompanionMode,
  isBuddyCompanionMode,
} from './types';

export const BUDDY_COMPANION_DISPLAY_KEY = 'drplant.buddy.floatingDisplay';

export const BUDDY_COMPANION_MODE_LABELS: Record<BuddyCompanionMode, string> = {
  visible: 'Visible',
  minimized: 'Minimized',
  hidden: 'Hidden',
};

export function readBuddyCompanionMode(): BuddyCompanionMode {
  if (typeof window === 'undefined') return 'visible';
  const raw = window.localStorage.getItem(BUDDY_COMPANION_DISPLAY_KEY);
  return isBuddyCompanionMode(raw) ? raw : 'visible';
}

export function writeBuddyCompanionMode(mode: BuddyCompanionMode) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BUDDY_COMPANION_DISPLAY_KEY, mode);
}

export function buddyCompanionModes(): readonly BuddyCompanionMode[] {
  return BUDDY_COMPANION_MODES;
}
