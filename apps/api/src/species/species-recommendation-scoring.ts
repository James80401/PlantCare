import type { PlantSpecies } from '@prisma/client';
import { inferDifficulty, isSucculentSpecies, speciesDiscoveryTags } from './species-catalog-meta';
import { resolveSpeciesMetadata } from './species-metadata';

export interface SpeciesFitResult {
  score: number;
  /** Short, user-facing reasons this plant fits — surfaced as "why recommended" chips. */
  reasons: string[];
}

/**
 * Scores how well a species fits a user's experience and light, and collects the
 * human-readable reasons behind the positive signals. Pure so it is unit-testable
 * and so the API and any explanation copy stay in sync.
 */
export function scoreSpeciesFit(
  species: PlantSpecies,
  experience: string,
  lightLevel: string,
): SpeciesFitResult {
  let score = 1;
  const reasons: string[] = [];
  const difficulty = inferDifficulty(species);
  const tags = speciesDiscoveryTags(species);
  const metadata = resolveSpeciesMetadata(species);
  const sunlight = species.sunlight?.toLowerCase() ?? '';

  if (experience === 'beginner') {
    if (difficulty === 'Beginner') {
      score += 4;
      reasons.push('Easy to care for');
    } else if (difficulty === 'Moderate') {
      score += 1;
    } else {
      score -= 2;
    }
  } else if (experience === 'intermediate') {
    if (difficulty === 'Moderate') {
      score += 3;
      reasons.push('A good step up');
    }
    if (difficulty === 'Beginner') {
      score += 2;
      reasons.push('Reliable and forgiving');
    }
  } else if (experience === 'advanced') {
    if (difficulty === 'Advanced') {
      score += 3;
      reasons.push('A rewarding challenge');
    }
    if (difficulty === 'Moderate') {
      score += 2;
      reasons.push('Keeps things interesting');
    }
  }

  if (lightLevel === 'low') {
    if (tags.includes('Low light') || sunlight.includes('low')) {
      score += 3;
      reasons.push('Tolerates low light');
    }
    if (isSucculentSpecies(species) && !sunlight.includes('low')) {
      score -= 1;
    }
  } else if (lightLevel === 'high' || lightLevel === 'bright') {
    if (sunlight.includes('bright') || sunlight.includes('full sun')) {
      score += 3;
      reasons.push('Thrives in bright light');
    }
  } else {
    if (tags.includes('Indoor-friendly') || sunlight.includes('indirect')) {
      score += 2;
      reasons.push('Fits typical indoor light');
    }
  }

  if (tags.includes('Pet-safe') && experience === 'beginner') {
    score += 1;
    reasons.push('Pet-safe');
  }
  if (metadata.bloomsIndoors && experience !== 'advanced') {
    score += 1;
    reasons.push('Blooms indoors');
  }
  if (metadata.pollinatorFriendly && tags.includes('Outdoor-friendly')) {
    score += 2;
    reasons.push('Pollinator favorite');
  }
  if (metadata.humidity === 'high' && lightLevel === 'low') {
    score -= 2;
  }
  if (metadata.humidity === 'high' && (lightLevel === 'medium' || !lightLevel)) {
    score += 1;
  }

  return { score, reasons };
}
