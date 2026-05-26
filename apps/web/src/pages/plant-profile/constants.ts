import type { PlantTab } from './types';

export const DR_PLANT_SECTION_ID = 'dr-plant';

export function plantDrPlantPath(plantId: string) {
  return `/garden/plants/${plantId}/health#${DR_PLANT_SECTION_ID}`;
}

export const PROFILE_TABS: { id: PlantTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'care', label: 'Care' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'journal', label: 'Journal' },
  { id: 'health', label: 'Health' },
];

export const journalPrompts = [
  'New growth:',
  'Height:',
  'Leaf count:',
  'Soil check:',
  'Pest check:',
  'After care:',
];
