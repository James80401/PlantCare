import { ActivityType } from '@prisma/client';

export const ACTIVITY_REWARDS: Record<
  ActivityType,
  { sunlight: number; dewdrops: number; label: string; emoji: string; minutes: number }
> = {
  WATERING_CHECK: { sunlight: 12, dewdrops: 5, label: 'Watering check', emoji: '💧', minutes: 4 },
  SUNLIGHT_AUDIT: { sunlight: 10, dewdrops: 4, label: 'Sunlight audit', emoji: '☀️', minutes: 5 },
  PEST_INSPECTION: { sunlight: 10, dewdrops: 5, label: 'Pest inspection', emoji: '🔍', minutes: 7 },
  PLANT_JOURNAL: { sunlight: 15, dewdrops: 6, label: 'Plant journal', emoji: '📓', minutes: 8 },
  REPOTTING_GUIDE: { sunlight: 20, dewdrops: 8, label: 'Repotting guide', emoji: '🪴', minutes: 12 },
  SEASON_CHECK: { sunlight: 10, dewdrops: 4, label: 'Season check', emoji: '🌡️', minutes: 4 },
  PROGRESS_PHOTO: { sunlight: 8, dewdrops: 3, label: 'Progress photo', emoji: '📸', minutes: 2 },
  HUMIDITY_CHECK: { sunlight: 7, dewdrops: 3, label: 'Humidity check', emoji: '🌬️', minutes: 3 },
  PRUNING_GUIDE: { sunlight: 12, dewdrops: 5, label: 'Pruning guide', emoji: '✂️', minutes: 6 },
  PROPAGATION_LOG: { sunlight: 18, dewdrops: 8, label: 'Propagation log', emoji: '🌱', minutes: 5 },
};

export const ACTIVITY_TYPES = Object.keys(ACTIVITY_REWARDS) as ActivityType[];
