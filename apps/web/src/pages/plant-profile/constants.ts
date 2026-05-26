import type { PlantTab } from './types';

import { DR_PLANT_HASH, plantDrPlantPath, plantHealthPath } from '../../utils/gardenPaths';

export const DR_PLANT_SECTION_ID = DR_PLANT_HASH;

export { plantDrPlantPath, plantHealthPath };

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
