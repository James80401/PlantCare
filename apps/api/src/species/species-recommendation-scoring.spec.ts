import { scoreSpeciesFit } from './species-recommendation-scoring';

// Minimal PlantSpecies-shaped fixtures. metadataJson is null so the scorer falls
// back to computed metadata, matching how unseeded/test rows behave.
function species(overrides: Record<string, unknown> = {}) {
  return {
    id: 'sp-1',
    commonName: 'Cast Iron Plant',
    scientificName: 'Aspidistra elatior',
    sunlight: 'Low to medium indirect',
    wateringFreqDays: 14, // >= 12 → Beginner difficulty
    toxicity: 'Non-toxic to pets',
    careNotes: 'Tolerant of neglect and low light.',
    phMin: 6,
    phMax: 7,
    metadataJson: null,
    ...overrides,
  } as never;
}

describe('scoreSpeciesFit', () => {
  it('explains a beginner, low-light, pet-safe match', () => {
    const { score, reasons } = scoreSpeciesFit(species(), 'beginner', 'low');

    expect(reasons).toEqual(
      expect.arrayContaining(['Easy to care for', 'Tolerates low light', 'Pet-safe']),
    );
    expect(score).toBeGreaterThan(5);
  });

  it('rewards challenge for advanced growers and notes indoor light fit', () => {
    const advanced = species({
      commonName: 'Demanding Diva',
      scientificName: 'Difficulta exigens',
      sunlight: 'Bright indirect',
      wateringFreqDays: 3, // <= 4, non-succulent → Advanced difficulty
      toxicity: 'Toxic to pets',
      careNotes: 'Needs consistent moisture and attention.',
    });

    const { reasons } = scoreSpeciesFit(advanced, 'advanced', 'medium');

    expect(reasons).toContain('A rewarding challenge');
    expect(reasons).toContain('Fits typical indoor light');
    // Pet-safe is only credited for beginners, and this plant is toxic anyway.
    expect(reasons).not.toContain('Pet-safe');
  });

  it('does not claim an easy-care reason when a hard plant is shown to a beginner', () => {
    const hard = species({
      sunlight: 'Bright indirect',
      wateringFreqDays: 3,
      toxicity: 'Toxic to pets',
      careNotes: 'Fussy and unforgiving.',
    });

    const { score, reasons } = scoreSpeciesFit(hard, 'beginner', 'medium');

    expect(reasons).not.toContain('Easy to care for');
    // Advanced difficulty penalizes a beginner-targeted score.
    expect(score).toBeLessThan(3);
  });
});
