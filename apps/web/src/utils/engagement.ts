import { addDays, differenceInCalendarDays, format, parseISO, startOfDay } from 'date-fns';
import type { TaskItem } from './taskGroups';
import { getGardenScore, scoreLabel } from './dashboard';

export type MilestoneId =
  | 'first_plant'
  | 'growing_garden'
  | 'plant_collector'
  | 'first_care'
  | 'care_rhythm_3'
  | 'care_rhythm_7'
  | 'thirty_days';

export interface Milestone {
  id: MilestoneId;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  progressLabel?: string;
}

export type MilestoneApiRow = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progressLabel?: string;
};

export interface EngagementContext {
  plantCount: number;
  oldestPlantAgeDays: number;
  completedInRange: number;
  streak: number;
}

export interface GardenWellness {
  score: number;
  label: string;
  headline: string;
  detail: string;
}

export interface SharePlantSnapshot {
  plantName: string;
  speciesName: string;
  scientificName?: string | null;
  location?: string | null;
  sunlight?: string | null;
  nextCareLabel?: string | null;
}

const MILESTONE_DEFS: Array<{
  id: MilestoneId;
  title: string;
  description: string;
  emoji: string;
  isUnlocked: (ctx: EngagementContext) => boolean;
  progressLabel?: (ctx: EngagementContext) => string | undefined;
}> = [
  {
    id: 'first_plant',
    title: 'First plant',
    description: 'You started a living garden in Plant Care.',
    emoji: '🌱',
    isUnlocked: (ctx) => ctx.plantCount >= 1,
  },
  {
    id: 'growing_garden',
    title: 'Growing garden',
    description: 'Three plants are under your care.',
    emoji: '🪴',
    isUnlocked: (ctx) => ctx.plantCount >= 3,
    progressLabel: (ctx) => `${Math.min(ctx.plantCount, 3)}/3 plants`,
  },
  {
    id: 'plant_collector',
    title: 'Plant collector',
    description: 'Five plants — a real collection.',
    emoji: '🌿',
    isUnlocked: (ctx) => ctx.plantCount >= 5,
    progressLabel: (ctx) => `${Math.min(ctx.plantCount, 5)}/5 plants`,
  },
  {
    id: 'first_care',
    title: 'First care win',
    description: 'You completed a care task. That counts.',
    emoji: '✨',
    isUnlocked: (ctx) => ctx.completedInRange >= 1,
  },
  {
    id: 'care_rhythm_3',
    title: '3-day rhythm',
    description: 'Three days in a row with at least one care action.',
    emoji: '💚',
    isUnlocked: (ctx) => ctx.streak >= 3,
    progressLabel: (ctx) =>
      ctx.streak >= 3 ? undefined : `${Math.min(ctx.streak, 3)}/3 days`,
  },
  {
    id: 'care_rhythm_7',
    title: '7-day rhythm',
    description: 'A full week of showing up — gently, without pressure.',
    emoji: '🌻',
    isUnlocked: (ctx) => ctx.streak >= 7,
    progressLabel: (ctx) =>
      ctx.streak >= 7 ? undefined : `${Math.min(ctx.streak, 7)}/7 days`,
  },
  {
    id: 'thirty_days',
    title: '30 days together',
    description: 'At least one plant has been with you for a month.',
    emoji: '📅',
    isUnlocked: (ctx) => ctx.oldestPlantAgeDays >= 30,
    progressLabel: (ctx) =>
      ctx.oldestPlantAgeDays >= 30
        ? undefined
        : `${Math.min(ctx.oldestPlantAgeDays, 30)}/30 days`,
  },
];

/** Consecutive calendar days with ≥1 completed task (today still counts if empty). */
export function getCareStreak(tasks: TaskItem[], currentDate = new Date()) {
  const completionDays = new Set(
    tasks
      .filter((task) => task.status === 'DONE' && task.completedAt)
      .map((task) => format(startOfDay(parseISO(task.completedAt!)), 'yyyy-MM-dd')),
  );

  if (completionDays.size === 0) return 0;

  let streak = 0;
  let day = startOfDay(currentDate);
  const todayKey = format(day, 'yyyy-MM-dd');

  if (!completionDays.has(todayKey)) {
    day = addDays(day, -1);
  }

  while (completionDays.has(format(day, 'yyyy-MM-dd'))) {
    streak += 1;
    day = addDays(day, -1);
  }

  return streak;
}

export function getOldestPlantAgeDays(
  plantCreatedAts: Array<string | Date | null | undefined>,
  currentDate = new Date(),
) {
  const dates = plantCreatedAts
    .filter(Boolean)
    .map((value) => startOfDay(typeof value === 'string' ? parseISO(value) : value!));

  if (dates.length === 0) return 0;

  const oldest = dates.reduce((min, date) => (date < min ? date : min), dates[0]);
  return Math.max(0, differenceInCalendarDays(startOfDay(currentDate), oldest));
}

export function milestonesFromApi(rows: MilestoneApiRow[] | undefined): Milestone[] | null {
  if (!rows?.length) return null;
  return rows.map((row) => ({
    id: row.id as MilestoneId,
    title: row.title,
    description: row.description,
    emoji: row.emoji,
    unlocked: row.unlocked,
    unlockedAt: row.unlockedAt,
    progressLabel: row.progressLabel,
  }));
}

export function resolveMilestones(
  apiRows: MilestoneApiRow[] | undefined,
  ctx: EngagementContext,
): Milestone[] {
  const apiMilestones = milestonesFromApi(apiRows);
  if (!apiMilestones) return deriveMilestones(ctx);

  const byId = new Map(apiMilestones.map((milestone) => [milestone.id, milestone]));
  return MILESTONE_DEFS.map((definition) => (
    byId.get(definition.id) ?? {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      emoji: definition.emoji,
      unlocked: false,
      progressLabel: definition.progressLabel?.(ctx),
    }
  ));
}

export function deriveMilestones(ctx: EngagementContext): Milestone[] {
  return MILESTONE_DEFS.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    emoji: definition.emoji,
    unlocked: definition.isUnlocked(ctx),
    progressLabel: definition.progressLabel?.(ctx),
  }));
}

export function getMilestoneHighlights(milestones: Milestone[], limit = 4) {
  const unlocked = milestones.filter((item) => item.unlocked);
  const next = milestones.find((item) => !item.unlocked);
  const recent = unlocked.slice(-Math.max(1, limit - (next ? 1 : 0)));
  return next ? [...recent, next] : recent.slice(-limit);
}

export function getGardenWellness(
  plantCount: number,
  overdueCount: number,
  todayCount: number,
  completedInRange: number,
  streak: number,
): GardenWellness {
  if (plantCount === 0) {
    return {
      score: 0,
      label: 'New',
      headline: 'Your garden story starts here',
      detail: 'Add a plant when you are ready — there is no rush.',
    };
  }

  const score = getGardenScore(
    plantCount,
    overdueCount,
    todayCount,
    Math.min(4, completedInRange),
  );
  const label = scoreLabel(score);

  if (overdueCount > 0) {
    return {
      score,
      label,
      headline: 'A gentle catch-up day',
      detail: `${overdueCount} overdue task${overdueCount === 1 ? '' : 's'} — pick one plant and start there. Progress still counts.`,
    };
  }

  if (todayCount > 0) {
    return {
      score,
      label,
      headline: 'Today is a care day',
      detail: `${todayCount} task${todayCount === 1 ? '' : 's'} due today. One step at a time is enough.`,
    };
  }

  if (streak >= 7) {
    return {
      score,
      label,
      headline: `${streak}-day care rhythm`,
      detail: 'You have been showing up for your plants. Rest days are fine too.',
    };
  }

  if (streak >= 3) {
    return {
      score,
      label,
      headline: `${streak}-day care rhythm`,
      detail: 'Small consistent check-ins beat perfect schedules.',
    };
  }

  if (completedInRange >= 3) {
    return {
      score,
      label,
      headline: 'Nice recent momentum',
      detail: `${completedInRange} tasks completed recently. Your garden noticed.`,
    };
  }

  return {
    score,
    label,
    headline: 'Your garden is in a calm stretch',
    detail: 'Nothing urgent right now. A quick observation or photo still helps.',
  };
}

export function formatSharePlantText(snapshot: SharePlantSnapshot) {
  const lines = [
    `🌿 ${snapshot.plantName}`,
    snapshot.speciesName,
    snapshot.scientificName ? `(${snapshot.scientificName})` : null,
    snapshot.location ? `📍 ${snapshot.location}` : null,
    snapshot.sunlight ? `☀️ ${snapshot.sunlight}` : null,
    snapshot.nextCareLabel ? `Next: ${snapshot.nextCareLabel}` : null,
    '',
    'Tracked with Plant Care',
  ].filter((line): line is string => line !== null && line !== '');

  return lines.join('\n');
}

export function buildEngagementContext(
  plantCount: number,
  plantCreatedAts: Array<string | Date | null | undefined>,
  tasks: TaskItem[],
  currentDate = new Date(),
): EngagementContext {
  return {
    plantCount,
    oldestPlantAgeDays: getOldestPlantAgeDays(plantCreatedAts, currentDate),
    completedInRange: tasks.filter((task) => task.status === 'DONE').length,
    streak: getCareStreak(tasks, currentDate),
  };
}
