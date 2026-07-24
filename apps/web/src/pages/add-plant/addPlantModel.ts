export interface Species {
  id: string;
  commonName: string;
  scientificName?: string;
  sunlight?: string;
  wateringFreqDays?: number;
  toxicity?: string;
  discoveryTags?: string[];
  defaultImageUrl?: string;
}

export interface ExternalSpeciesMatch {
  provider: 'plantnet' | 'demo';
  providerMatchId?: string;
  commonName: string;
  scientificName?: string;
  confidence?: number;
  integrationStatus: 'requires_confirmation';
  careArchetype?: {
    id: string;
    label: string;
    description: string;
  };
}

export type AddPlantStep = 'photo' | 'confirm' | 'search' | 'details';

export function normalizeConfidence(confidence: number | undefined) {
  if (typeof confidence !== 'number' || Number.isNaN(confidence)) return null;
  const percent = confidence <= 1 ? confidence * 100 : confidence;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

export function confidenceTone(confidence: number | null) {
  if (confidence == null) return 'Provider match';
  if (confidence >= 80) return 'Strong visual match';
  if (confidence >= 55) return 'Possible visual match';
  return 'Low-confidence visual match';
}

export function confidenceReviewCopy(confidence: number | null) {
  if (confidence == null) {
    return 'Review the name and photo before adding it. Dr. Plant will keep this match marked for review.';
  }
  if (confidence >= 80) {
    return 'This looks likely, but it is still photo identification. Confirm only if the name and image fit your plant.';
  }
  if (confidence >= 55) {
    return 'This is useful as a lead, not a final answer. Search manually if anything feels off.';
  }
  return 'This is uncertain. Search manually unless you recognize the plant from the name and photo.';
}

export const PLANT_LIFE_STAGE_OPTIONS = [
  {
    value: 'SEED',
    label: 'Seed',
    description: 'Not sprouted yet',
  },
  {
    value: 'SPROUT',
    label: 'Sprout',
    description: 'First growth just appeared',
  },
  {
    value: 'SEEDLING',
    label: 'Seedling',
    description: 'Small, delicate new plant',
  },
  {
    value: 'YOUNG_PLANT',
    label: 'Young plant',
    description: 'Actively growing but not fully established',
  },
  {
    value: 'ESTABLISHED',
    label: 'Established',
    description: 'Typical store-bought or settled plant',
  },
  {
    value: 'MATURE',
    label: 'Mature',
    description: 'Large, older, or long-settled plant',
  },
] as const;
