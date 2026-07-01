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
      'season',
      'light',
      'soil',
      'humidity',
      'temperature',
      'fertilizer',
      'pruning',
      'repotting',
      'propagation',
      'pests',
      'troubleshooting',
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

  it('includes season section with growth context', () => {
    const ctx = buildOverviewContext('Kitchen Pothos', species, PotSize.MEDIUM);
    const season = buildStructuredPlantCareSections(ctx).find((s) => s.id === 'season');
    expect(season?.heading).toBe('Season & weather');
    expect(season?.beginnerBody).toContain('Kitchen Pothos');
  });

  it('includes troubleshooting guidance with Dr. Plant context', () => {
    const ctx = buildOverviewContext('Kitchen Pothos', species, PotSize.MEDIUM);
    const troubleshooting = buildStructuredPlantCareSections(ctx).find(
      (s) => s.id === 'troubleshooting',
    );

    expect(troubleshooting?.beginnerBody).toContain('Dr. Plant');
    expect(troubleshooting?.advancedBody).toContain('stabilize');
    expect(troubleshooting?.advancedBody).toContain('Prompt starter');
    expect(troubleshooting?.warnings.length).toBeGreaterThan(0);
  });

  it('includes weather hint when advice is provided', () => {
    const ctx = buildOverviewContext(
      'Kitchen Pothos',
      species,
      PotSize.MEDIUM,
      'Living room',
      undefined,
      undefined,
      {
        plantId: 'plant-1',
        createdAt: new Date('2024-01-01'),
        weatherAdvice: {
          fromCache: true,
          fetchedAt: '2026-05-19',
          locationLabel: 'Home',
          timezone: 'UTC',
          overviewAlerts: [],
          summary: { days: [] },
          plants: [
            {
              plantId: 'plant-1',
              plantName: 'Kitchen Pothos',
              environment: 'indoor',
              advice: 'Extra dry air this week — mist lightly.',
              severity: 'info',
            },
          ],
        },
        now: new Date('2026-05-19'),
      },
    );
    const season = buildStructuredPlantCareSections(ctx).find((s) => s.id === 'season');
    expect(season?.beginnerBody).toContain('Extra dry air');
  });

  it('omits notes section when plant has no notes', () => {
    const ctx = buildOverviewContext('Kitchen Pothos', species, PotSize.MEDIUM);
    const sections = buildStructuredPlantCareSections(ctx);

    expect(sections.some((s) => s.id === 'notes')).toBe(false);
  });
});
