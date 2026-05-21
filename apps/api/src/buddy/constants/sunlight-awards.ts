/** Sunlight (daily XP bar) per PlantCare TaskType. */
export const SUNLIGHT_BY_TASK_TYPE: Record<string, number> = {
  WATER: 10,
  FERTILIZE: 10,
  REPOT: 15,
  PRUNE: 10,
  PEST_CONTROL: 8,
  MIST: 7,
  ROTATE: 6,
  CHECK_MOISTURE: 5,
  CLEAN_LEAVES: 8,
  INSPECT_PESTS: 8,
  PH_TEST: 5,
  HEALTH_CHECK: 12,
};

export const DEWDROPS_PER_TASK = 3;

export const SUNLIGHT_CAP = 100;

export const SPECIES_SUNLIGHT_MULTIPLIER: Record<string, number> = {
  sunflower: 1.2,
  succulent: 1.0,
  monstera: 1.0,
  cactus: 1.0,
};

export function sunlightForTask(taskType: string, speciesId: string): number {
  const base = SUNLIGHT_BY_TASK_TYPE[taskType] ?? 8;
  const mult = SPECIES_SUNLIGHT_MULTIPLIER[speciesId] ?? 1;
  return Math.round(base * mult);
}
