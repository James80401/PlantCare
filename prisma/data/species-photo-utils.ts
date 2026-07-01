import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { speciesSeedId, type SpeciesSeed } from './species-catalog';

const reusableLicensePatterns = [
  /^cc0\b/i,
  /^cc[- ]?by\b/i,
  /^cc[- ]?by[- ]?sa\b/i,
  /\bpublic domain\b/i,
  /^pd\b/i,
  /\bgfdl\b/i,
  /\bfree art license\b/i,
];

const restrictedLicensePatterns = [
  /\ball rights reserved\b/i,
  /\bnon[- ]?commercial\b/i,
  /\bcc[- ]?by[- ]?nc\b/i,
  /\bcc[- ]?by[- ]?nd\b/i,
  /\bno derivatives?\b/i,
  /\bfair use\b/i,
  /\bcopyrighted\b/i,
  /\bunknown\b/i,
  /\bsee (inaturalist|wikipedia|commons)\b/i,
];

type SpeciesPhotoManifest = Record<string, { license?: string; url?: string } | undefined>;

export function isReusablePhotoLicense(license: string | null | undefined): boolean {
  const normalized = String(license || '').trim();
  if (!normalized) return false;
  if (restrictedLicensePatterns.some((pattern) => pattern.test(normalized))) return false;
  return reusableLicensePatterns.some((pattern) => pattern.test(normalized));
}

export function loadSpeciesPhotoManifest(repoRoot = process.cwd()): SpeciesPhotoManifest {
  const manifestPath = join(repoRoot, 'prisma', 'data', 'species-photo-sources.json');
  if (!existsSync(manifestPath)) return {};
  return JSON.parse(readFileSync(manifestPath, 'utf8')) as SpeciesPhotoManifest;
}

/** Legacy single-slug id when user plants predate full scientific slug ids. */
export function legacySpeciesSeedId(commonName: string): string {
  return `seed-${commonName.toLowerCase().replace(/\s+/g, '-')}`;
}

/** First on-disk photo id for this species (DB id, catalog id, or legacy id). */
export function resolveSpeciesPhotoFileKey(
  targetId: string,
  species: Pick<SpeciesSeed, 'commonName' | 'scientificName'>,
  photosDir: string,
  manifest: SpeciesPhotoManifest = {},
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
    const photo = manifest[id];
    if (!photo?.url || !isReusablePhotoLicense(photo.license)) continue;
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
