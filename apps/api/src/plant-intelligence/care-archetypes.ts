export type CareArchetypeId =
  | 'tropical_foliage'
  | 'drought_tolerant'
  | 'high_humidity'
  | 'edible_fast_growth'
  | 'flowering_houseplant'
  | 'general_houseplant';

export interface CareArchetype {
  id: CareArchetypeId;
  label: string;
  description: string;
  beginnerNotes: string[];
  treatmentModifiers: string[];
}

export interface ArchetypeSpeciesInput {
  commonName: string;
  scientificName?: string | null;
  sunlight?: string | null;
  wateringFreqDays?: number | null;
  toxicity?: string | null;
  careNotes?: string | null;
}

const ARCHETYPES: Record<CareArchetypeId, CareArchetype> = {
  tropical_foliage: {
    id: 'tropical_foliage',
    label: 'Tropical foliage',
    description: 'Leafy indoor plants that prefer steady moisture, warmth, and bright indirect light.',
    beginnerNotes: [
      'Avoid big swings in watering, light, or temperature while the plant is recovering.',
      'Check the soil before watering instead of watering only by calendar.',
    ],
    treatmentModifiers: [
      'Keep the plant away from cold drafts while it recovers.',
      'Use bright indirect light; harsh direct sun can make stressed leaves worse.',
    ],
  },
  drought_tolerant: {
    id: 'drought_tolerant',
    label: 'Drought-tolerant',
    description: 'Succulents, cacti, and slow-water plants that fail more often from excess moisture.',
    beginnerNotes: [
      'When unsure, wait and check the soil again before watering.',
      'Recovery is usually slower because these plants grow gradually.',
    ],
    treatmentModifiers: [
      'Let the potting mix dry deeper between checks.',
      'Prioritize drainage and root inspection before adding more water.',
    ],
  },
  high_humidity: {
    id: 'high_humidity',
    label: 'High-humidity sensitive',
    description: 'Plants that often crisp, curl, or stall when air is dry or minerals build up.',
    beginnerNotes: [
      'Humidity helps, but wet soil is not a substitute for humid air.',
      'Brown edges may stop spreading before damaged tissue looks better.',
    ],
    treatmentModifiers: [
      'Increase ambient humidity with a pebble tray or grouped plants.',
      'Use filtered water if tips continue browning after watering is corrected.',
    ],
  },
  edible_fast_growth: {
    id: 'edible_fast_growth',
    label: 'Edible fast grower',
    description: 'Herbs, vegetables, and fruiting plants that respond quickly to water, nutrients, and light.',
    beginnerNotes: [
      'Avoid strong treatments on edible leaves close to harvest.',
      'Fast growth means symptoms can change quickly, so recheck within a few days.',
    ],
    treatmentModifiers: [
      'Use food-safe pest controls and follow label instructions.',
      'Check for nutrient and light stress if older leaves yellow first.',
    ],
  },
  flowering_houseplant: {
    id: 'flowering_houseplant',
    label: 'Flowering houseplant',
    description: 'Indoor bloomers where stress can show as dropped buds, stalled flowers, or leaf decline.',
    beginnerNotes: [
      'Do not fertilize heavily while the plant is actively declining.',
      'Spent blooms can be removed, but avoid cutting healthy leaves during recovery.',
    ],
    treatmentModifiers: [
      'Keep light steady and avoid moving the plant repeatedly.',
      'Delay repotting unless roots or soil are clearly part of the problem.',
    ],
  },
  general_houseplant: {
    id: 'general_houseplant',
    label: 'General houseplant',
    description: 'Common indoor plants with balanced water, light, and inspection needs.',
    beginnerNotes: [
      'Change one care variable at a time so you can tell what helped.',
      'Old damaged leaves may not repair, so judge recovery by new growth and no new damage.',
    ],
    treatmentModifiers: [
      'Check light, watering, pot drainage, and pests before assuming disease.',
      'Schedule a follow-up health check to confirm symptoms are slowing.',
    ],
  },
};

function textFor(species: ArchetypeSpeciesInput): string {
  return [
    species.commonName,
    species.scientificName,
    species.sunlight,
    species.toxicity,
    species.careNotes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function resolveCareArchetype(species: ArchetypeSpeciesInput): CareArchetype {
  const text = textFor(species);
  const name = species.commonName.toLowerCase();

  if (/basil|mint|thyme|oregano|tomato|pepper|lettuce|herb|vegetable|fruit|citrus/.test(text)) {
    return ARCHETYPES.edible_fast_growth;
  }

  if (/orchid|peace lily|african violet|anthurium|bromeliad|kalanchoe|christmas cactus|thanksgiving cactus|hoya/.test(text)) {
    return ARCHETYPES.flowering_houseplant;
  }

  if (/fern|calathea|maranta|prayer plant|fittonia|nerve plant|maidenhair|stromanthe|orchid/.test(text)) {
    return ARCHETYPES.high_humidity;
  }

  if (
    /cactus|succulent|aloe|jade|echeveria|haworthia|lithops|snake plant|sansevieria|zz plant/.test(text) ||
    (species.wateringFreqDays != null && species.wateringFreqDays >= 12)
  ) {
    return ARCHETYPES.drought_tolerant;
  }

  if (
    /monstera|pothos|philodendron|ficus|dieffenbachia|dracaena|schefflera|pilea|peperomia|ivy/.test(
      name,
    )
  ) {
    return ARCHETYPES.tropical_foliage;
  }

  return ARCHETYPES.general_houseplant;
}

