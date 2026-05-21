import { GrowthStage } from '@prisma/client';

/** Journey count thresholds for growth stage (Phase 1: through SEEDLING). */
export const JOURNEY_STAGE_THRESHOLDS: { minJourneys: number; stage: GrowthStage }[] = [
  { minJourneys: 100, stage: GrowthStage.ANCIENT },
  { minJourneys: 60, stage: GrowthStage.ESTABLISHED },
  { minJourneys: 30, stage: GrowthStage.YOUNG_PLANT },
  { minJourneys: 15, stage: GrowthStage.SEEDLING },
  { minJourneys: 5, stage: GrowthStage.SPROUT },
  { minJourneys: 0, stage: GrowthStage.SEED },
];

export function growthStageFromJourneyCount(journeyCount: number): GrowthStage {
  for (const row of JOURNEY_STAGE_THRESHOLDS) {
    if (journeyCount >= row.minJourneys) return row.stage;
  }
  return GrowthStage.SEED;
}

export function unlockedBiomesForStage(stage: GrowthStage): string[] {
  const biomes = ['seed_garden'];
  if (
    stage === GrowthStage.SPROUT ||
    stage === GrowthStage.SEEDLING ||
    stage === GrowthStage.YOUNG_PLANT ||
    stage === GrowthStage.ESTABLISHED ||
    stage === GrowthStage.ANCIENT
  ) {
    biomes.push('forest_floor');
  }
  if (
    stage === GrowthStage.SEEDLING ||
    stage === GrowthStage.YOUNG_PLANT ||
    stage === GrowthStage.ESTABLISHED ||
    stage === GrowthStage.ANCIENT
  ) {
    biomes.push('desert_oasis');
  }
  return biomes;
}
