import type { PlantSpecies } from '@prisma/client';
import { resolveSpeciesMetadata } from './species-metadata';

export type SpeciesDifficulty = 'Beginner' | 'Moderate' | 'Advanced';
export type SpeciesToxicitySummary = 'Pet-safe' | 'Toxic' | 'Caution' | 'Unknown';

export interface SpeciesCatalogMeta {
  discoveryTags: string[];
  difficulty: SpeciesDifficulty;
  toxicitySummary: SpeciesToxicitySummary;
  phRangeLabel?: string;
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

const succulentTerms =
  /succulent|cactus|cacti|sedum|echeveria|crassula|haworthia|aloe|jade plant|string of pearls|lithops|sempervivum|aeonium|agave|yucca|zz plant|snake plant|sansevieria/i;

const beginnerHints =
  /easy|forgiving|tolerant|beginner|low maintenance|undemanding|hard to kill|neglect|stores water|drought tolerant|water sparingly/i;

const advancedHints =
  /sensitive|fussy|high humidity|never let dry|fluoride|dramatic|avoid moving|drops leaves when|goes dormant|very high humidity/i;

function searchableText(species: Pick<PlantSpecies, 'commonName' | 'scientificName' | 'careNotes'>) {
  return `${species.commonName} ${species.scientificName ?? ''} ${species.careNotes ?? ''}`.toLowerCase();
}

export function inferToxicitySummary(
  species: Pick<PlantSpecies, 'toxicity'>,
): SpeciesToxicitySummary {
  const toxicity = species.toxicity?.toLowerCase() ?? '';
  if (!toxicity) return 'Unknown';
  if (toxicity.includes('non-toxic')) return 'Pet-safe';
  if (toxicity.includes('humans') || toxicity.includes('children')) return 'Caution';
  if (toxicity.includes('toxic') || toxicity.includes('mildly toxic')) return 'Toxic';
  return 'Unknown';
}

export function inferDifficulty(
  species: Pick<
    PlantSpecies,
    'commonName' | 'scientificName' | 'careNotes' | 'wateringFreqDays' | 'sunlight'
  >,
): SpeciesDifficulty {
  const text = searchableText(species);
  const sunlight = species.sunlight?.toLowerCase() ?? '';

  if (advancedHints.test(text)) return 'Advanced';
  if (beginnerHints.test(text) || species.wateringFreqDays >= 12) return 'Beginner';
  if (
    species.wateringFreqDays >= 10 &&
    (sunlight.includes('low') || succulentTerms.test(text))
  ) {
    return 'Beginner';
  }
  if (species.wateringFreqDays <= 4 && !succulentTerms.test(text)) return 'Advanced';
  return 'Moderate';
}

export function isSucculentSpecies(
  species: Pick<PlantSpecies, 'commonName' | 'scientificName' | 'careNotes'>,
): boolean {
  return succulentTerms.test(searchableText(species));
}

export function buildPhRangeLabel(species: Pick<PlantSpecies, 'phMin' | 'phMax'>): string | undefined {
  if (species.phMin == null || species.phMax == null) return undefined;
  return `pH ${species.phMin}–${species.phMax}`;
}

export function speciesDiscoveryTags(species: PlantSpecies): string[] {
  const tags: string[] = [];
  const sunlight = species.sunlight?.toLowerCase() ?? '';
  const searchable = searchableText(species);
  const difficulty = inferDifficulty(species);

  if (inferToxicitySummary(species) === 'Pet-safe') tags.push('Pet-safe');
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
  if (isSucculentSpecies(species)) tags.push('Succulent');
  if (difficulty === 'Beginner') tags.push('Beginner-friendly');

  return [...new Set(tags)].slice(0, 6);
}

export function buildSpeciesCatalogMeta(species: PlantSpecies): SpeciesCatalogMeta {
  return {
    discoveryTags: speciesDiscoveryTags(species),
    difficulty: inferDifficulty(species),
    toxicitySummary: inferToxicitySummary(species),
    phRangeLabel: buildPhRangeLabel(species),
  };
}

const DIFFICULTY_ORDER: Record<string, number> = {
  Beginner: 0,
  Moderate: 1,
  Advanced: 2,
};

export function compareSpeciesForSort(
  a: PlantSpecies,
  b: PlantSpecies,
  sort: 'name' | 'waterAsc' | 'waterDesc' | 'difficulty',
): number {
  if (sort === 'waterAsc') {
    return b.wateringFreqDays - a.wateringFreqDays || a.commonName.localeCompare(b.commonName);
  }
  if (sort === 'waterDesc') {
    return a.wateringFreqDays - b.wateringFreqDays || a.commonName.localeCompare(b.commonName);
  }
  if (sort === 'difficulty') {
    const da = DIFFICULTY_ORDER[inferDifficulty(a)] ?? 1;
    const db = DIFFICULTY_ORDER[inferDifficulty(b)] ?? 1;
    return da - db || a.commonName.localeCompare(b.commonName);
  }
  return a.commonName.localeCompare(b.commonName);
}
