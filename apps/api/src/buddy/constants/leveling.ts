export const BUDDY_XP_REWARDS = {
  TASK_COMPLETED: 8,
  ACTIVITY_COMPLETED: 18,
  QUEST_CLAIM_BASE: 20,
  JOURNEY_COMPLETED: 45,
  STREAK_BONUS: 20,
} as const;

export const BUDDY_LEVEL_THRESHOLDS = [
  0, 60, 140, 250, 390, 560, 760, 990, 1250, 1540, 1860, 2210, 2590, 3000, 3440,
] as const;

export const SHOP_TIER_LEVEL_REQUIREMENTS: Record<number, number> = {
  1: 1,
  2: 4,
  3: 8,
  4: 12,
};

export function buddyLevelFromXp(experiencePoints: number): number {
  let level = 1;
  for (let i = 0; i < BUDDY_LEVEL_THRESHOLDS.length; i++) {
    if (experiencePoints >= BUDDY_LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    }
  }
  return level;
}

export function buddyLevelProgress(experiencePoints: number) {
  const level = buddyLevelFromXp(experiencePoints);
  const currentLevelXp = BUDDY_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = BUDDY_LEVEL_THRESHOLDS[level] ?? null;
  const xpIntoLevel = experiencePoints - currentLevelXp;
  const xpForNextLevel = nextLevelXp === null ? 0 : nextLevelXp - currentLevelXp;
  const progressPercent =
    nextLevelXp === null ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));

  return {
    level,
    experiencePoints,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpForNextLevel,
    progressPercent,
  };
}

export function levelRequiredForShopTier(tier: number): number {
  return SHOP_TIER_LEVEL_REQUIREMENTS[tier] ?? 1;
}
