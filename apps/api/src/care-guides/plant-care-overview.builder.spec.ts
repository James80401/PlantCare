import { PotSize } from '@prisma/client';

import {
  buildOverviewContext,
  buildStructuredPlantCareSections,
} from './plant-care-overview.builder';

describe('plant-care-overview.builder', () => {
  const species = {
    commonName: 'Pothos',
    scientificName: 'Epipremnum aureum',
    careNotes: 'Easy trailing vine.',
    sunlight: 'Bright indirect light',
    phMin: 6.0,
    phMax: 6.5,
    wateringFreqDays: 7,
    toxicity: 'Mildly toxic to pets if ingested',
  };

  it('builds all core topics plus notes when present', () => {
    const ctx = buildOverviewContext(
      'Kitchen Pothos',
      species,
      PotSize.MEDIUM,
      'Living room window',
      'Likes a weekly bottom soak.',
    );
    const sections = buildStructuredPlantCareSections(ctx);

    expect(sections.map((s) => s.id)).toEqual([
      'water',
      'light',
      'soil',
      'humidity',
      'temperature',
      'fertilizer',
      'pruning',
      'repotting',
      'propagation',
      'pests',
      'toxicity',
      'notes',
    ]);
    expect(sections.find((s) => s.id === 'notes')?.beginnerBody).toContain(
      'weekly bottom soak',
    );
  });

  it('includes plant name and interval in water section', () => {
    const ctx = buildOverviewContext('Kitchen Pothos', species, PotSize.MEDIUM);
    const water = buildStructuredPlantCareSections(ctx).find((s) => s.id === 'water');

    expect(water?.beginnerBody).toContain('Kitchen Pothos');
    expect(water?.beginnerBody).toMatch(/\*\*\d+ days\*\*/);
    expect(water?.warnings.length).toBeGreaterThan(0);
    expect(water?.whyItMatters.length).toBeGreaterThan(10);
  });

  it('weaves location guidance into humidity section', () => {
    const ctx = buildOverviewContext(
      'Kitchen Pothos',
      species,
      PotSize.MEDIUM,
      'Patio',
    );
    const humidity = buildStructuredPlantCareSections(ctx).find(
      (s) => s.id === 'humidity',
    );

    expect(humidity?.beginnerBody).toContain('Kitchen Pothos');
    expect(humidity?.beginnerBody.length).toBeGreaterThan(50);
  });

  it('omits notes section when plant has no notes', () => {
    const ctx = buildOverviewContext('Kitchen Pothos', species, PotSize.MEDIUM);
    const sections = buildStructuredPlantCareSections(ctx);

    expect(sections.some((s) => s.id === 'notes')).toBe(false);
  });
});
