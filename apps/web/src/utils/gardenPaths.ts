export const DR_PLANT_HASH = 'dr-plant';

export function plantDrPlantPath(plantId: string) {
  return `/garden/plants/${plantId}/health#${DR_PLANT_HASH}`;
}

export function plantHealthPath(plantId: string) {
  return `/garden/plants/${plantId}/health`;
}

export const PLANT_DETAILS_SECTION_ID = 'plant-details';

export function plantProfileDetailsPath(plantId: string) {
  return `/garden/plants/${plantId}/overview#${PLANT_DETAILS_SECTION_ID}`;
}

export function isProfilePhotoAttentionReason(reason: string) {
  return reason.toLowerCase().includes('add a photo');
}

export function isDiagnosisAttentionReason(reason: string) {
  return reason.toLowerCase().includes('diagnosis');
}
