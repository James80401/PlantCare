export const DR_PLANT_HASH = 'dr-plant';

export function plantDrPlantPath(plantId: string) {
  return `/garden/plants/${plantId}/health#${DR_PLANT_HASH}`;
}

export function plantHealthPath(plantId: string) {
  return `/garden/plants/${plantId}/health`;
}

export function isDiagnosisAttentionReason(reason: string) {
  return reason.toLowerCase().includes('diagnosis');
}
