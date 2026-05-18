import {
  buildMetadataForSpecies,
  parseSpeciesMetadata,
  resolveSpeciesMetadata,
  serializeSpeciesMetadata,
} from './species-metadata';

describe('species metadata', () => {
  const monstera = {
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    sunlight: 'Bright indirect',
    wateringFreqDays: 7,
    toxicity: 'Toxic to pets',
    careNotes: 'Climbing aroid; high humidity helps.',
  };

  it('builds override metadata for known species', () => {
    const meta = buildMetadataForSpecies(monstera);
    expect(meta.pests).toContain('Thrips');
    expect(meta.humidity).toBe('high');
    expect(meta.growthRate).toBe('fast');
  });

  it('serializes and parses metadata json', () => {
    const meta = buildMetadataForSpecies(monstera);
    const json = serializeSpeciesMetadata(meta);
    expect(parseSpeciesMetadata(json)?.pests).toEqual(meta.pests);
  });

  it('prefers stored metadataJson when valid', () => {
    const stored = serializeSpeciesMetadata({ pests: ['Custom pest'], humidity: 'low' });
    const resolved = resolveSpeciesMetadata({ ...monstera, metadataJson: stored });
    expect(resolved.pests).toEqual(['Custom pest']);
    expect(resolved.humidity).toBe('low');
  });

  it('falls back when metadataJson is invalid', () => {
    const resolved = resolveSpeciesMetadata({ ...monstera, metadataJson: 'not-json' });
    expect(resolved.pests?.length).toBeGreaterThan(0);
  });
});
