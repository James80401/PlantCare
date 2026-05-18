import type { PlantSpecies } from '@prisma/client';

export interface SpeciesMetadata {
  pests?: string[];
  diseases?: string[];
  hardinessZones?: string[];
  humidity?: 'low' | 'medium' | 'high';
  tempMinF?: number;
  tempMaxF?: number;
  growthRate?: 'slow' | 'medium' | 'fast';
  matureSize?: string;
}

export type SpeciesMetadataInput = Pick<
  PlantSpecies,
  'commonName' | 'scientificName' | 'sunlight' | 'wateringFreqDays' | 'toxicity' | 'careNotes'
>;

const HOUSEPLANT_PESTS = ['Spider mites', 'Mealybugs', 'Scale', 'Fungus gnats'];
const EDIBLE_PESTS = ['Aphids', 'Whiteflies', 'Hornworms', 'Slugs'];
const FERN_PESTS = ['Spider mites', 'Scale'];

const OVERRIDES: Record<string, Partial<SpeciesMetadata>> = {
  Monstera: {
    pests: ['Spider mites', 'Thrips', 'Scale'],
    diseases: ['Root rot', 'Leaf spot'],
    hardinessZones: ['10-12'],
    humidity: 'high',
    tempMinF: 65,
    tempMaxF: 85,
    growthRate: 'fast',
    matureSize: '6–10 ft indoors with support',
  },
  'Snake Plant': {
    pests: ['Mealybugs', 'Spider mites'],
    diseases: ['Root rot from overwatering'],
    hardinessZones: ['9-11'],
    humidity: 'low',
    tempMinF: 55,
    tempMaxF: 85,
    growthRate: 'slow',
    matureSize: '2–4 ft tall',
  },
  Pothos: {
    pests: ['Spider mites', 'Mealybugs'],
    diseases: ['Root rot', 'Bacterial leaf spot'],
    hardinessZones: ['10-12'],
    humidity: 'medium',
    tempMinF: 65,
    tempMaxF: 85,
    growthRate: 'fast',
    matureSize: 'Trailing 6–10 ft',
  },
  'Peace Lily': {
    pests: ['Aphids', 'Mealybugs'],
    diseases: ['Root rot', 'Cylindrocladium leaf spot'],
    hardinessZones: ['10-12'],
    humidity: 'high',
    tempMinF: 65,
    tempMaxF: 80,
    growthRate: 'medium',
    matureSize: '1–4 ft',
  },
  'ZZ Plant': {
    pests: ['Aphids', 'Scale'],
    diseases: ['Root rot'],
    hardinessZones: ['9-11'],
    humidity: 'low',
    tempMinF: 60,
    tempMaxF: 75,
    growthRate: 'slow',
    matureSize: '2–3 ft',
  },
  'Spider Plant': {
    pests: ['Aphids', 'Spider mites'],
    diseases: ['Leaf tip burn', 'Root rot'],
    hardinessZones: ['9-11'],
    humidity: 'medium',
    tempMinF: 55,
    tempMaxF: 80,
    growthRate: 'fast',
    matureSize: '1–2 ft tall; long trailers',
  },
  Basil: {
    pests: ['Aphids', 'Japanese beetles', 'Slugs'],
    diseases: ['Downy mildew', 'Fusarium wilt', 'Gray mold'],
    hardinessZones: ['10-11'],
    humidity: 'medium',
    tempMinF: 60,
    tempMaxF: 85,
    growthRate: 'fast',
    matureSize: '12–24 in',
  },
  Tomato: {
    pests: ['Hornworms', 'Aphids', 'Whiteflies'],
    diseases: ['Early blight', 'Late blight', 'Blossom end rot'],
    hardinessZones: ['9-11'],
    humidity: 'medium',
    tempMinF: 55,
    tempMaxF: 85,
    growthRate: 'fast',
    matureSize: '3–6 ft',
  },
  'Fiddle Leaf Fig': {
    pests: ['Spider mites', 'Mealybugs', 'Scale'],
    diseases: ['Root rot', 'Bacterial infection'],
    hardinessZones: ['10-11'],
    humidity: 'medium',
    tempMinF: 65,
    tempMaxF: 75,
    growthRate: 'medium',
    matureSize: '6–10 ft indoors',
  },
  'Boston Fern': {
    pests: FERN_PESTS,
    diseases: ['Root rot', 'Leaf tip burn'],
    hardinessZones: ['10-11'],
    humidity: 'high',
    tempMinF: 60,
    tempMaxF: 75,
    growthRate: 'medium',
    matureSize: '2–3 ft spread',
  },
};

function searchableText(species: SpeciesMetadataInput) {
  return `${species.commonName} ${species.scientificName ?? ''} ${species.careNotes ?? ''}`.toLowerCase();
}

function isEdible(species: SpeciesMetadataInput) {
  const text = searchableText(species);
  return /basil|mint|thyme|oregano|tomato|pepper|lettuce|herb|kitchen|harvest|edible|vegetable|fruit/.test(
    text,
  );
}

function isFern(species: SpeciesMetadataInput) {
  return /fern/i.test(species.commonName) || /fern/i.test(species.scientificName ?? '');
}

function isSucculent(species: SpeciesMetadataInput) {
  return /succulent|cactus|aloe|jade|echeveria|haworthia|sedum|zz plant|snake plant|sansevieria/i.test(
    searchableText(species),
  );
}

function inferHumidity(species: SpeciesMetadataInput): SpeciesMetadata['humidity'] {
  const text = searchableText(species);
  if (/high humidity|mist|humid|never let dry|filtered water|fluoride/.test(text)) {
    return 'high';
  }
  if (isSucculent(species) || species.wateringFreqDays >= 12) return 'low';
  return 'medium';
}

function inferZones(species: SpeciesMetadataInput): string[] {
  const sun = species.sunlight?.toLowerCase() ?? '';
  if (sun.includes('full sun') && isEdible(species)) return ['9-11'];
  if (sun.includes('low') || sun.includes('indoor')) return ['10-12'];
  if (isSucculent(species)) return ['9-11'];
  return ['10-11'];
}

function inferGrowthRate(species: SpeciesMetadataInput): SpeciesMetadata['growthRate'] {
  if (species.wateringFreqDays <= 5 || isEdible(species)) return 'fast';
  if (species.wateringFreqDays >= 12 || isSucculent(species)) return 'slow';
  return 'medium';
}

function inferMatureSize(species: SpeciesMetadataInput): string {
  const name = species.commonName.toLowerCase();
  if (name.includes('palm')) return '4–8 ft indoors over time';
  if (name.includes('vine') || name.includes('pothos') || name.includes('philodendron')) {
    return 'Trailing or climbing several feet';
  }
  if (isSucculent(species)) return 'Compact; varies by species';
  if (isEdible(species)) return '12–36 in typical harvest height';
  return '1–3 ft typical indoor size';
}

function inferPests(species: SpeciesMetadataInput): string[] {
  if (isEdible(species)) return EDIBLE_PESTS.slice(0, 3);
  if (isFern(species)) return FERN_PESTS;
  if (isSucculent(species)) return ['Mealybugs', 'Scale'];
  return HOUSEPLANT_PESTS.slice(0, 3);
}

function inferDiseases(species: SpeciesMetadataInput): string[] {
  const list = ['Root rot from overwatering'];
  if (isEdible(species)) list.push('Powdery mildew', 'Leaf spot');
  if (/fern|calathea|maranta/i.test(species.commonName)) {
    list.push('Leaf tip burn', 'Fungal leaf spot');
  }
  return list.slice(0, 3);
}

function inferTemps(species: SpeciesMetadataInput): { tempMinF: number; tempMaxF: number } {
  const humidity = inferHumidity(species);
  if (humidity === 'high') return { tempMinF: 65, tempMaxF: 80 };
  if (humidity === 'low') return { tempMinF: 55, tempMaxF: 85 };
  return { tempMinF: 60, tempMaxF: 82 };
}

export function buildMetadataForSpecies(species: SpeciesMetadataInput): SpeciesMetadata {
  const override = OVERRIDES[species.commonName];
  const base: SpeciesMetadata = {
    pests: inferPests(species),
    diseases: inferDiseases(species),
    hardinessZones: inferZones(species),
    humidity: inferHumidity(species),
    ...inferTemps(species),
    growthRate: inferGrowthRate(species),
    matureSize: inferMatureSize(species),
  };
  return { ...base, ...override };
}

export function serializeSpeciesMetadata(metadata: SpeciesMetadata): string {
  return JSON.stringify(metadata);
}

export function parseSpeciesMetadata(json?: string | null): SpeciesMetadata | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as SpeciesMetadata;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function resolveSpeciesMetadata(species: SpeciesMetadataInput & { metadataJson?: string | null }) {
  return parseSpeciesMetadata(species.metadataJson) ?? buildMetadataForSpecies(species);
}
