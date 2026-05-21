import type { BuddyAnimationDef } from './buddyAnimationCatalog';
import { BUDDY_LIVE_ANIMATIONS } from './buddyAnimationCatalog';
import type { BuddyPhraseContext } from './buddyPhraseContext';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const BIAS_IDS: Record<string, string[]> = {
  rain: ['rain-happy', 'umbrella', 'rainbow', 'mist-leaves'],
  celebrate: ['celebrate', 'cheer-jump', 'team-cheer', 'clap', 'jump-joy'],
  journey: ['travel', 'biome-dream', 'float'],
};

export function buildCompanionAnimationRotation(
  context: BuddyPhraseContext | null,
  seedKey: string,
): BuddyAnimationDef[] {
  let pool = shuffle(BUDDY_LIVE_ANIMATIONS);

  if (context?.weatherRainHint) {
    const bias = BIAS_IDS.rain;
    const preferred = pool.filter((a) => bias.includes(a.id));
    const rest = pool.filter((a) => !bias.includes(a.id));
    pool = [...preferred, ...rest];
  } else if (context && context.garden.completedToday > 0) {
    const bias = BIAS_IDS.celebrate;
    const preferred = pool.filter((a) => bias.includes(a.id));
    const rest = pool.filter((a) => !bias.includes(a.id));
    pool = [...preferred, ...rest];
  } else if (context?.traveling) {
    return pool.filter((a) => a.id === 'float' || a.id === 'moonwalk').length
      ? [...pool.filter((a) => a.id === 'float' || a.id === 'moonwalk'), ...pool]
      : pool;
  }

  void seedKey;
  return pool;
}
