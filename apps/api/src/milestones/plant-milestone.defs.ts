import { getOldestPlantAgeDays } from '../dashboard/dashboard-helpers';

export type PlantMilestoneKey =
  | 'first_plant'
  | 'growing_garden'
  | 'plant_collector'
  | 'first_care'
  | 'care_rhythm_3'
  | 'care_rhythm_7'
  | 'thirty_days';

export interface MilestoneEngagementSnapshot {
  plantCount: number;
  plantCreatedAts: Date[];
  completedInRange: number;
  streak: number;
}

export interface PlantMilestoneDefinition {
  id: PlantMilestoneKey;
  title: string;
  description: string;
  emoji: string;
  isUnlocked: (ctx: MilestoneEngagementSnapshot) => boolean;
  progressLabel?: (ctx: MilestoneEngagementSnapshot) => string | undefined;
}

export const PLANT_MILESTONE_DEFS: PlantMilestoneDefinition[] = [
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
    isUnlocked: (ctx) =>
      getOldestPlantAgeDays(ctx.plantCreatedAts) >= 30,
    progressLabel: (ctx) => {
      const days = getOldestPlantAgeDays(ctx.plantCreatedAts);
      return days >= 30 ? undefined : `${Math.min(days, 30)}/30 days`;
    },
  },
];

export interface PlantMilestoneDto {
  id: PlantMilestoneKey;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progressLabel?: string;
}

export function buildMilestoneDtos(
  persistedKeys: Map<string, Date>,
  snapshot: MilestoneEngagementSnapshot,
): PlantMilestoneDto[] {
  return PLANT_MILESTONE_DEFS.map((definition) => {
    const unlockedAt = persistedKeys.get(definition.id) ?? null;
    const unlocked = unlockedAt != null;
    return {
      id: definition.id,
      title: definition.title,
      description: definition.description,
      emoji: definition.emoji,
      unlocked,
      unlockedAt: unlockedAt?.toISOString() ?? null,
      progressLabel: unlocked
        ? undefined
        : definition.progressLabel?.(snapshot),
    };
  });
}

export function milestoneKeysToUnlock(snapshot: MilestoneEngagementSnapshot): PlantMilestoneKey[] {
  return PLANT_MILESTONE_DEFS.filter((definition) => definition.isUnlocked(snapshot)).map(
    (definition) => definition.id,
  );
}
