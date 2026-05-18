import { speciesSeedId, type SpeciesSeed } from './species-catalog';

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
