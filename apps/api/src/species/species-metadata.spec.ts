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
    phMin: 5.5,
    phMax: 7,
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

  it('infers phase-3 fields for edibles and ferns', () => {
    const basil = {
      ...monstera,
      commonName: 'Basil',
      scientificName: 'Ocimum basilicum',
      sunlight: 'Full sun',
      careNotes: 'Harvest regularly; kitchen herb for outdoor garden.',
      phMin: 6,
      phMax: 7,
    };
    const meta = buildMetadataForSpecies(basil);
    expect(meta.pollinatorFriendly).toBe(true);
    expect(meta.propagation).toEqual(expect.arrayContaining(['Seed']));

    const fern = {
      ...monstera,
      commonName: 'Boston Fern',
      careNotes: 'Needs higher humidity; mist regularly.',
    };
    const fernMeta = buildMetadataForSpecies(fern);
    expect(fernMeta.humidity).toBe('high');
    expect(fernMeta.bloomSeason).toMatch(/non-flowering/i);
  });

  it('recognizes high-humidity plant families by name', () => {
    const calathea = {
      ...monstera,
      commonName: 'Calathea Medallion',
      scientificName: 'Calathea veitchiana',
      sunlight: 'Medium indirect light',
      careNotes: 'Decorative foliage.',
    };
    expect(buildMetadataForSpecies(calathea).humidity).toBe('high');

    const alocasia = {
      ...monstera,
      commonName: 'Alocasia Polly',
      scientificName: 'Alocasia amazonica',
      careNotes: 'Dramatic leaves.',
    };
    expect(buildMetadataForSpecies(alocasia).humidity).toBe('high');
  });

  it('keeps succulents on the low-humidity track', () => {
    const snake = {
      ...monstera,
      commonName: 'Snake Plant',
      scientificName: 'Sansevieria trifasciata',
      sunlight: 'Low to bright indirect',
      wateringFreqDays: 14,
      careNotes: 'Very drought tolerant; water sparingly.',
    };
    expect(buildMetadataForSpecies(snake).humidity).toBe('low');
  });

  it('marks known indoor bloomers even when they are succulents', () => {
    const christmasCactus = {
      ...monstera,
      commonName: 'Christmas Cactus',
      scientificName: 'Schlumbergera bridgesii',
      sunlight: 'Bright indirect light',
      wateringFreqDays: 10,
      careNotes: 'Blooms near the holidays with cool nights.',
    };
    expect(buildMetadataForSpecies(christmasCactus).bloomsIndoors).toBe(true);

    const kalanchoe = {
      ...monstera,
      commonName: 'Kalanchoe',
      scientificName: 'Kalanchoe blossfeldiana',
      sunlight: 'Bright light',
      careNotes: 'Florist kalanchoe.',
    };
    expect(buildMetadataForSpecies(kalanchoe).bloomsIndoors).toBe(true);
  });

  it('does not claim indoor blooms for plain foliage plants', () => {
    const pothos = {
      ...monstera,
      commonName: 'Pothos',
      scientificName: 'Epipremnum aureum',
      sunlight: 'Medium indirect light',
      careNotes: 'Trailing foliage vine.',
    };
    const meta = buildMetadataForSpecies(pothos);
    expect(meta.bloomsIndoors).toBe(false);
    expect(meta.humidity).toBe('medium');
  });
});
