export const FRIENDSHIP_LEVEL_NAMES: Record<number, string> = {
  1: 'Neighbors',
  2: 'Acquaintances',
  3: 'Friends',
  4: 'Good Friends',
  5: 'Close Friends',
  6: 'Plant Pals',
  7: 'Garden Friends',
  8: 'Kindred Spirits',
  9: 'Garden Soulmates',
  10: 'Eternal Gardeners',
};

/** Cumulative sunshine points required to reach each level (level 1 = 0). */
export const FRIENDSHIP_LEVEL_THRESHOLDS: { level: number; points: number; bonusDewdrops: number }[] = [
  { level: 1, points: 0, bonusDewdrops: 0 },
  { level: 2, points: 5, bonusDewdrops: 5 },
  { level: 3, points: 15, bonusDewdrops: 10 },
  { level: 4, points: 30, bonusDewdrops: 15 },
  { level: 5, points: 50, bonusDewdrops: 25 },
  { level: 6, points: 75, bonusDewdrops: 25 },
  { level: 7, points: 100, bonusDewdrops: 30 },
  { level: 8, points: 150, bonusDewdrops: 35 },
  { level: 9, points: 200, bonusDewdrops: 40 },
  { level: 10, points: 300, bonusDewdrops: 50 },
];

export function levelFromPoints(points: number): number {
  let level = 1;
  for (const row of FRIENDSHIP_LEVEL_THRESHOLDS) {
    if (points >= row.points) level = row.level;
  }
  return level;
}

export function levelUpBonus(previousLevel: number, newLevel: number): number {
  if (newLevel <= previousLevel) return 0;
  return FRIENDSHIP_LEVEL_THRESHOLDS.find((r) => r.level === newLevel)?.bonusDewdrops ?? 0;
}
