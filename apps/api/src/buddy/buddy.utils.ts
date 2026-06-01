import { Buddy, BuddyJourney } from '@prisma/client';
import { buddyLevelProgress } from './constants/leveling';

export function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === 'string');
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === 'string');
    } catch {
      return [];
    }
  }
  return [];
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

export function appendPersonalityChoice(
  existing: unknown,
  entry: { journeyId: string; choice: number; recordedAt: string },
): string {
  let choices: unknown[] = [];
  if (typeof existing === 'string') {
    try {
      const parsed = JSON.parse(existing) as unknown;
      if (Array.isArray(parsed)) choices = parsed;
    } catch {
      choices = [];
    }
  } else if (Array.isArray(existing)) {
    choices = existing;
  }
  return JSON.stringify([...choices, entry]);
}

export function formatBuddy(buddy: Buddy & { journeys?: BuddyJourney[] }) {
  const activeJourney = buddy.journeys?.find((j) => !j.completed) ?? null;
  const levelProgress = buddyLevelProgress(buddy.experiencePoints);
  return {
    id: buddy.id,
    name: buddy.name,
    speciesId: buddy.speciesId,
    trait: buddy.trait,
    growthStage: buddy.growthStage,
    journeyCount: buddy.journeyCount,
    dewdrops: buddy.dewdrops,
    experiencePoints: buddy.experiencePoints,
    level: levelProgress.level,
    levelProgress,
    bloomTokens: buddy.bloomTokens ?? 0,
    bloomTokensEnabled: buddy.speciesId === 'rose',
    sunlightToday: buddy.sunlightToday,
    tasksToday: buddy.tasksToday,
    mood: buddy.mood,
    streakDays: buddy.streakDays,
    longestStreak: buddy.longestStreak,
    gardenCode: buddy.gardenCode,
    equippedItems: parseJsonObject(buddy.equippedItems),
    unlockedSpecies: parseStringArray(buddy.unlockedSpecies),
    unlockedBiomes: parseStringArray(buddy.unlockedBiomes),
    currentBiome: buddy.currentBiome,
    terrariumLayout: parseJsonObject(buddy.terrariumLayout),
    terrariumBackground: buddy.terrariumBackground,
    floatingCompanionMode: buddy.floatingCompanionMode,
    journeyReady: buddy.sunlightToday >= 100 && !activeJourney,
    hasActiveJourney: Boolean(activeJourney),
    createdAt: buddy.createdAt,
    updatedAt: buddy.updatedAt,
  };
}

export function generateGardenCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `SPROUT-${suffix}`;
}
