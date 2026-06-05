/**
 * Home-scene background gradients, keyed by the buddy's `terrariumBackground`
 * value (the shop ids stripped of their `bg_` prefix). Shared by the live scene
 * (BuddyScene) and the shop previews (ShopItemPreview) so a chosen background
 * looks the SAME in the picker as on the buddy — and so each one is visibly
 * distinct rather than all falling back to the default.
 */
export const BUDDY_BACKGROUNDS: Record<string, string> = {
  // Bright, warm late-morning light.
  sunny_windowsill: 'from-sky-200 via-amber-100 to-lime-200',
  // Lush glass-house greens.
  greenhouse: 'from-teal-200 via-emerald-200 to-green-400',
  // Cool, overcast, rain-on-glass.
  rainy_window: 'from-slate-400 via-sky-300 to-slate-300',
  // Deep dappled woodland.
  forest: 'from-lime-300 via-emerald-500 to-teal-800',
};

/** Accepts a `terrariumBackground` key or a `bg_`-prefixed shop id. */
export function buddyBackgroundClass(idOrKey?: string | null): string {
  const key = (idOrKey ?? '').replace(/^bg_/, '');
  return BUDDY_BACKGROUNDS[key] ?? BUDDY_BACKGROUNDS.sunny_windowsill;
}

/** A short, distinct accent tag per background (sun, droplets, trees…). */
export type BackgroundAccent = 'sun' | 'leaves' | 'rain' | 'trees';

export function buddyBackgroundAccent(idOrKey?: string | null): BackgroundAccent {
  const key = (idOrKey ?? '').replace(/^bg_/, '');
  if (key === 'rainy_window') return 'rain';
  if (key === 'forest') return 'trees';
  if (key === 'greenhouse') return 'leaves';
  return 'sun';
}
