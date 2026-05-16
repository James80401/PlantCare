import { TaskType } from '@prisma/client';
import { imagesByKeys, allImageDefs } from './care-guide-images';
import type { CareGuideSeed } from './care-guide-types';
import { buildGenericGuideSections, collectImageKeys } from './care-guide-templates';

function genericGuide(taskType: TaskType, id: string, title: string, summary: string): CareGuideSeed {
  const sections = buildGenericGuideSections(taskType);
  return {
    id,
    taskType,
    title,
    summary,
    sections,
    images: imagesByKeys(collectImageKeys(sections), allImageDefs),
  };
}

export const genericCareGuideSeeds: CareGuideSeed[] = [
  genericGuide(
    TaskType.WATER,
    'guide-water-generic',
    'How to water your plant',
    'Check soil, match water amount to your plant’s needs, and ensure drainage for {speciesName}.',
  ),
  genericGuide(
    TaskType.PRUNE,
    'guide-prune-generic',
    'How to prune your plant',
    'Use clean tools, cut above nodes, and remove dead growth for {speciesName}.',
  ),
  genericGuide(
    TaskType.FERTILIZE,
    'guide-fertilize-generic',
    'How to fertilize your plant',
    'Feed during active growth with diluted balanced fertilizer for {speciesName}.',
  ),
  genericGuide(
    TaskType.MIST,
    'guide-mist-generic',
    'How to mist your plant',
    'Raise humidity on leaves without over-wetting soil for {speciesName}.',
  ),
  genericGuide(
    TaskType.PH_TEST,
    'guide-ph-generic',
    'How to test soil pH',
    'Match soil pH to your plant’s preferred range ({phRange}) for nutrient uptake.',
  ),
  genericGuide(
    TaskType.PEST_CONTROL,
    'guide-pest-generic',
    'Pest inspection & treatment',
    'Find pests early on leaf undersides and stems on {speciesName}.',
  ),
  genericGuide(
    TaskType.REPOT,
    'guide-repot-generic',
    'How to repot your plant',
    'Size up only when roots need room; use fresh, well-draining mix for {speciesName}.',
  ),
];
