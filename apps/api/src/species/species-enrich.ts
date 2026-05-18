import type { PlantSpecies } from '@prisma/client';
import { buildSpeciesCatalogMeta } from './species-catalog-meta';
import { resolveSpeciesMetadata } from './species-metadata';

export function enrichSpeciesRecord<T extends PlantSpecies>(species: T) {
  const meta = buildSpeciesCatalogMeta(species);
  const metadata = resolveSpeciesMetadata(species);
  return {
    ...species,
    discoveryTags: meta.discoveryTags,
    difficulty: meta.difficulty,
    toxicitySummary: meta.toxicitySummary,
    phRangeLabel: meta.phRangeLabel,
    metadata,
  };
}
