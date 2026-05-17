import type { PlantSpecies } from '@prisma/client';

export interface SpeciesSearchFilters {
  petSafe?: boolean;
  lowLight?: boolean;
  edible?: boolean;
  droughtTolerant?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
}

export function parseSpeciesSearchFilters(query: {
  petSafe?: string;
  lowLight?: string;
  edible?: string;
  droughtTolerant?: string;
  indoor?: string;
  outdoor?: string;
}): SpeciesSearchFilters {
  return {
    petSafe: query.petSafe === 'true',
    lowLight: query.lowLight === 'true',
    edible: query.edible === 'true',
    droughtTolerant: query.droughtTolerant === 'true',
    indoor: query.indoor === 'true',
    outdoor: query.outdoor === 'true',
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

  if (filters.petSafe && !toxicity.includes('non-toxic') && !toxicity.includes('safe')) {
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

  return true;
}

export function speciesDiscoveryTags(species: PlantSpecies) {
  const tags: string[] = [];
  const sunlight = species.sunlight?.toLowerCase() ?? '';
  const toxicity = species.toxicity?.toLowerCase() ?? '';
  const searchable = text(species);

  if (toxicity.includes('non-toxic') || toxicity.includes('safe')) tags.push('Pet-safe');
  if (sunlight.includes('low')) tags.push('Low light');
  if (edibleTerms.some((term) => searchable.includes(term))) tags.push('Edible');
  if (species.wateringFreqDays >= 10 || searchable.includes('drought')) {
    tags.push('Drought-tolerant');
  }
  if (sunlight.includes('indirect') || sunlight.includes('low') || sunlight.includes('medium')) {
    tags.push('Indoor-friendly');
  }
  if (sunlight.includes('full sun') || sunlight.includes('partial') || searchable.includes('garden')) {
    tags.push('Outdoor-friendly');
  }

  return tags.slice(0, 4);
}
