import type { PlantSpecies } from '@prisma/client';
import {
  buildSpeciesCatalogMeta,
  compareSpeciesForSort,
  inferDifficulty,
  isSucculentSpecies,
  speciesDiscoveryTags,
} from './species-catalog-meta';

export type { SpeciesCatalogMeta, SpeciesDifficulty, SpeciesToxicitySummary } from './species-catalog-meta';
export { buildSpeciesCatalogMeta, compareSpeciesForSort, speciesDiscoveryTags };

export interface SpeciesSearchFilters {
  petSafe?: boolean;
  lowLight?: boolean;
  edible?: boolean;
  droughtTolerant?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
  beginnerFriendly?: boolean;
  succulent?: boolean;
}

export type SpeciesBrowseSort = 'name' | 'waterAsc' | 'waterDesc';

export function parseSpeciesSearchFilters(query: {
  petSafe?: string;
  lowLight?: string;
  edible?: string;
  droughtTolerant?: string;
  indoor?: string;
  outdoor?: string;
  beginnerFriendly?: string;
  succulent?: string;
}): SpeciesSearchFilters {
  return {
    petSafe: query.petSafe === 'true',
    lowLight: query.lowLight === 'true',
    edible: query.edible === 'true',
    droughtTolerant: query.droughtTolerant === 'true',
    indoor: query.indoor === 'true',
    outdoor: query.outdoor === 'true',
    beginnerFriendly: query.beginnerFriendly === 'true',
    succulent: query.succulent === 'true',
  };
}

const edibleTerms = [
  'basil',
  'mint',
  'thyme',
  'oregano',
  'sage',
  'parsley',
  'cilantro',
  'dill',
  'chive',
  'lavender',
  'tomato',
  'pepper',
  'lettuce',
  'spinach',
  'kale',
  'cucumber',
  'zucchini',
  'bean',
  'pea',
  'strawberry',
  'blueberry',
  'apple',
  'citrus',
  'fig',
  'harvest',
  'edible',
  'tea',
  'kitchen',
  'flavor',
];

function text(species: Pick<PlantSpecies, 'commonName' | 'scientificName' | 'careNotes'>) {
  return `${species.commonName} ${species.scientificName ?? ''} ${species.careNotes ?? ''}`.toLowerCase();
}

export function speciesMatchesFilters(species: PlantSpecies, filters: SpeciesSearchFilters) {
  const sunlight = species.sunlight?.toLowerCase() ?? '';
  const toxicity = species.toxicity?.toLowerCase() ?? '';
  const searchable = text(species);

  if (filters.petSafe && !toxicity.includes('non-toxic')) {
    return false;
  }

  if (filters.lowLight && !sunlight.includes('low')) {
    return false;
  }

  if (filters.edible && !edibleTerms.some((term) => searchable.includes(term))) {
    return false;
  }

  if (
    filters.droughtTolerant &&
    species.wateringFreqDays < 10 &&
    !searchable.includes('drought')
  ) {
    return false;
  }

  if (
    filters.indoor &&
    !sunlight.includes('indirect') &&
    !sunlight.includes('low') &&
    !sunlight.includes('medium')
  ) {
    return false;
  }

  if (
    filters.outdoor &&
    !sunlight.includes('full sun') &&
    !sunlight.includes('partial') &&
    !searchable.includes('outdoor') &&
    !searchable.includes('garden')
  ) {
    return false;
  }

  if (filters.beginnerFriendly && inferDifficulty(species) !== 'Beginner') {
    return false;
  }

  if (filters.succulent && !isSucculentSpecies(species)) {
    return false;
  }

  return true;
}
