import { TaskType } from '@prisma/client';
import { speciesCatalog, speciesSeedId, type SpeciesSeed } from './species-catalog';
import { imagesByKeys, allImageDefs } from './care-guide-images';
import type { CareGuideSeed } from './care-guide-types';
import { classifySpecies } from './care-guide-classify';
import { buildTemplateSections, collectImageKeys } from './care-guide-templates';

export const ALL_TASK_TYPES: TaskType[] = [
  TaskType.WATER,
  TaskType.PRUNE,
  TaskType.FERTILIZE,
  TaskType.MIST,
  TaskType.PH_TEST,
  TaskType.PEST_CONTROL,
  TaskType.REPOT,
  TaskType.ROTATE,
  TaskType.CLEAN_LEAVES,
  TaskType.INSPECT_PESTS,
  TaskType.CHECK_MOISTURE,
  TaskType.HEALTH_CHECK,
];

function guideId(speciesId: string, taskType: TaskType): string {
  return `guide-${taskType.toLowerCase()}-${speciesId}`.slice(0, 100);
}

function taskSummary(taskType: TaskType, commonName: string): string {
  const map: Record<TaskType, string> = {
    [TaskType.WATER]: `Complete watering guide for {speciesName}: soil checks, drainage, and troubleshooting.`,
    [TaskType.PRUNE]: `How to prune and shape {speciesName} — where to cut, tools, and after-care.`,
    [TaskType.FERTILIZE]: `When and how to fertilize {speciesName} without burning roots.`,
    [TaskType.MIST]: `Humidity and misting for {speciesName} — when it helps and when to skip.`,
    [TaskType.PH_TEST]: `Soil pH targets and testing for {speciesName} ({phRange}).`,
    [TaskType.PEST_CONTROL]: `Inspect and treat pests on {speciesName}.`,
    [TaskType.REPOT]: `When and how to repot {speciesName} — soil, steps, recovery.`,
    [TaskType.ROTATE]: `Rotate {speciesName} for even light and upright growth.`,
    [TaskType.CLEAN_LEAVES]: `Remove dust from {speciesName} leaves so light reaches the plant.`,
    [TaskType.INSPECT_PESTS]: `Quick pest check on {speciesName} — catch issues early.`,
    [TaskType.CHECK_MOISTURE]: `Check soil moisture before watering {speciesName}.`,
    [TaskType.HEALTH_CHECK]: `Follow-up health check for {speciesName} after treatment.`,
  };
  return map[taskType];
}

function buildSpeciesGuide(
  s: SpeciesSeed,
  speciesId: string,
  taskType: TaskType,
): CareGuideSeed {
  const cat = classifySpecies(s);
  const sections = buildTemplateSections(taskType, cat, speciesId);
  const imageKeys = collectImageKeys(sections);

  return {
    id: guideId(speciesId, taskType),
    taskType,
    speciesId,
    title: taskTitlePlaceholder(taskType),
    summary: taskSummary(taskType, s.commonName),
    sections,
    images: imagesByKeys(imageKeys, allImageDefs),
  };
}

/** Titles use placeholder resolved at API layer */
function taskTitlePlaceholder(taskType: TaskType): string {
  const m: Record<TaskType, string> = {
    [TaskType.WATER]: 'Watering {speciesName}',
    [TaskType.PRUNE]: 'Pruning {speciesName}',
    [TaskType.FERTILIZE]: 'Fertilizing {speciesName}',
    [TaskType.MIST]: 'Humidity & misting {speciesName}',
    [TaskType.PH_TEST]: 'Soil pH for {speciesName}',
    [TaskType.PEST_CONTROL]: 'Pests on {speciesName}',
    [TaskType.REPOT]: 'Repotting {speciesName}',
    [TaskType.ROTATE]: 'Rotate {speciesName}',
    [TaskType.CLEAN_LEAVES]: 'Clean leaves on {speciesName}',
    [TaskType.INSPECT_PESTS]: 'Pest check for {speciesName}',
    [TaskType.CHECK_MOISTURE]: 'Moisture check for {speciesName}',
    [TaskType.HEALTH_CHECK]: 'Health check for {speciesName}',
  };
  return m[taskType];
}

export function generateSpeciesCareGuides(): CareGuideSeed[] {
  const guides: CareGuideSeed[] = [];

  for (const s of speciesCatalog) {
    const speciesId = speciesSeedId(s.commonName, s.scientificName);
    for (const taskType of ALL_TASK_TYPES) {
      guides.push(buildSpeciesGuide(s, speciesId, taskType));
    }
  }

  return guides;
}

export function getAllCareGuideSeeds(genericSeeds: CareGuideSeed[]): CareGuideSeed[] {
  return [...genericSeeds, ...generateSpeciesCareGuides()];
}
