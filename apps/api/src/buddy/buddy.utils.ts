import { Buddy, BuddyJourney } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { buddyLevelProgress } from './constants/leveling';

export interface StreakInput {
  streakDays: number;
  longestStreak: number;
}

export interface StreakUpdate {
  /** True when the buddy was already active today — caller should make no change. */
  alreadyActiveToday: boolean;
  streakDays: number;
  longestStreak: number;
  bonusDewdrops: number;
}

/**
 * Pure midnight-streak decision: given the current streak and the last active
 * day, compute the new streak after activity "now". A consecutive day extends
 * the streak; a gap resets it to 1; same-day activity is a no-op. Milestone days
 * (7, 30) award bonus dewdrops.
 */
export function computeStreakUpdate(
  current: StreakInput,
  lastActiveDate: Date | null,
  now: Date = new Date(),
): StreakUpdate {
  const today = startOfDay(now);
  const last = lastActiveDate ? startOfDay(lastActiveDate) : null;

  if (last && last.getTime() === today.getTime()) {
    return {
      alreadyActiveToday: true,
      streakDays: current.streakDays,
      longestStreak: current.longestStreak,
      bonusDewdrops: 0,
    };
  }

  const yesterday = startOfDay(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const streak = last && last.getTime() === yesterday.getTime() ? current.streakDays + 1 : 1;
  const longestStreak = Math.max(current.longestStreak, streak);

  let bonusDewdrops = 0;
  if (streak === 7) bonusDewdrops = 50;
  if (streak === 30) bonusDewdrops = 200;

  return { alreadyActiveToday: false, streakDays: streak, longestStreak, bonusDewdrops };
}

/**
 * How long a buddy journey runs, in ms. An explicit `BUDDY_JOURNEY_MINUTES`
 * override (at least 1 minute) accelerates journeys for demos/tests; outside
 * production journeys default to 2 minutes; in production they take the biome's
 * configured hours.
 */
export function computeJourneyDurationMs(opts: {
  demoMinutes?: string | null;
  isProduction: boolean;
  biomeHours: number;
}): number {
  if (opts.demoMinutes) {
    return Math.max(1, parseInt(opts.demoMinutes, 10)) * 60 * 1000;
  }
  if (!opts.isProduction) {
    return 2 * 60 * 1000;
  }
  return opts.biomeHours * 60 * 60 * 1000;
}

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
