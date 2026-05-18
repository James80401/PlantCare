import {
  buildSpeciesCatalogMeta,
  inferDifficulty,
  isSucculentSpecies,
} from './species-catalog-meta';
import { speciesMatchesFilters } from './species-filters';

describe('species catalog metadata', () => {
  const snakePlant = {
    id: '1',
    commonName: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    sunlight: 'Low to bright indirect',
    wateringFreqDays: 14,
    toxicity: 'Mildly toxic to pets',
    phMin: 6,
    phMax: 7.5,
    careNotes: 'Very drought tolerant; water sparingly.',
    perenualId: null,
    defaultImageUrl: null,
    metadataJson: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const maidenhair = {
    ...snakePlant,
    id: '2',
    commonName: 'Maidenhair Fern',
    scientificName: 'Adiantum',
    wateringFreqDays: 3,
    careNotes: 'Never let dry out; very high humidity.',
  };

  it('infers beginner-friendly snake plant', () => {
    expect(inferDifficulty(snakePlant)).toBe('Beginner');
    expect(isSucculentSpecies(snakePlant)).toBe(true);
    expect(speciesMatchesFilters(snakePlant, { beginnerFriendly: true })).toBe(true);
    expect(speciesMatchesFilters(snakePlant, { succulent: true })).toBe(true);
  });

  it('marks fussy plants as advanced', () => {
    expect(inferDifficulty(maidenhair)).toBe('Advanced');
    expect(speciesMatchesFilters(maidenhair, { beginnerFriendly: true })).toBe(false);
  });

  it('builds enriched catalog fields', () => {
    const meta = buildSpeciesCatalogMeta(snakePlant);
    expect(meta.difficulty).toBe('Beginner');
    expect(meta.phRangeLabel).toBe('pH 6–7.5');
    expect(meta.discoveryTags).toEqual(expect.arrayContaining(['Beginner-friendly', 'Succulent']));
  });
});
