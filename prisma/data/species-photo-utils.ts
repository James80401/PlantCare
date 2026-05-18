import { existsSync } from 'fs';
import { join } from 'path';
import { speciesSeedId, type SpeciesSeed } from './species-catalog';

/** Legacy single-slug id when user plants predate full scientific slug ids. */
export function legacySpeciesSeedId(commonName: string): string {
  return `seed-${commonName.toLowerCase().replace(/\s+/g, '-')}`;
}

/** First on-disk photo id for this species (DB id, catalog id, or legacy id). */
export function resolveSpeciesPhotoFileKey(
  targetId: string,
  species: Pick<SpeciesSeed, 'commonName' | 'scientificName'>,
  photosDir: string,
): string | null {
  const candidates = [
    targetId,
    speciesSeedId(species.commonName, species.scientificName),
    legacySpeciesSeedId(species.commonName),
  ];
  const seen = new Set<string>();
  for (const id of candidates) {
    if (seen.has(id)) continue;
    seen.add(id);
    if (existsSync(join(photosDir, speciesPhotoFilename(id)))) return id;
  }
  return null;
}

/** Stable filename / URL segment per catalog species (matches DB seed id). */
export function speciesPhotoKey(species: Pick<SpeciesSeed, 'commonName' | 'scientificName'>): string {
  return speciesSeedId(species.commonName, species.scientificName);
}

export function speciesPhotoFilename(key: string): string {
  return `${key}.jpg`;
}

export function speciesPhotoUrl(key: string): string {
  return `/care-guides/photos/species/${speciesPhotoFilename(key)}`;
}
