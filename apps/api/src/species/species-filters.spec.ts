import { speciesDiscoveryTags, speciesMatchesFilters } from './species-filters';

describe('species discovery filters', () => {
  const basil = species({
    commonName: 'Basil',
    scientificName: 'Ocimum basilicum',
    sunlight: 'Full sun',
    wateringFreqDays: 3,
    toxicity: 'Non-toxic to pets',
    careNotes: 'Harvest regularly; kitchen herb.',
  });

  const snakePlant = species({
    commonName: 'Snake Plant',
    scientificName: 'Sansevieria trifasciata',
    sunlight: 'Low to bright indirect',
    wateringFreqDays: 14,
    toxicity: 'Mildly toxic to pets',
    careNotes: 'Very drought tolerant; water sparingly.',
  });

  it('matches stable discovery filters from existing species fields', () => {
    expect(speciesMatchesFilters(basil, { edible: true })).toBe(true);
    expect(speciesMatchesFilters(basil, { petSafe: true })).toBe(true);
    expect(speciesMatchesFilters(basil, { lowLight: true })).toBe(false);
    expect(speciesMatchesFilters(snakePlant, { lowLight: true })).toBe(true);
    expect(speciesMatchesFilters(snakePlant, { droughtTolerant: true })).toBe(true);
  });

  it('returns discovery tags for UI cards', () => {
    expect(speciesDiscoveryTags(basil)).toEqual(
      expect.arrayContaining(['Pet-safe', 'Edible', 'Outdoor-friendly']),
    );
    expect(speciesDiscoveryTags(snakePlant)).toEqual(
      expect.arrayContaining(['Low light', 'Drought-tolerant', 'Indoor-friendly']),
    );
  });
});

function species(overrides: Record<string, unknown>) {
  return {
    id: 'species-1',
    perenualId: null,
    commonName: 'Plant',
    scientificName: null,
    sunlight: null,
    wateringFreqDays: 7,
    toxicity: null,
    phMin: null,
    phMax: null,
    careNotes: null,
    defaultImageUrl: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}
