import {
  buildGrowthStageNote,
  buildSeasonCareNote,
  buildWeatherCareHint,
  getSeason,
  inferPlantGrowthStage,
} from './plant-care-season.util';

describe('plant-care-season.util', () => {
  it('maps months to seasons', () => {
    expect(getSeason(new Date('2026-06-15'))).toBe('summer');
    expect(getSeason(new Date('2026-12-15'))).toBe('winter');
  });

  it('infers growth stage from planted or created date', () => {
    const now = new Date('2026-06-01');
    expect(
      inferPlantGrowthStage(new Date('2026-05-01'), new Date('2025-01-01'), now),
    ).toBe('new');
    expect(
      inferPlantGrowthStage(null, new Date('2025-10-01'), now),
    ).toBe('establishing');
    expect(
      inferPlantGrowthStage(null, new Date('2024-01-01'), now),
    ).toBe('established');
  });

  it('builds season and growth notes with plant name', () => {
    const season = buildSeasonCareNote('winter', 'fern', 'indoor', 'Fern');
    expect(season).toContain('Fern');
    const growth = buildGrowthStageNote('new', 'Fern', 'fern');
    expect(growth).toContain('acclimating');
  });

  it('prefers per-plant weather line when available', () => {
    const hint = buildWeatherCareHint(
      {
        fromCache: true,
        fetchedAt: '2026-01-01',
        locationLabel: 'Home',
        timezone: 'UTC',
        overviewAlerts: [],
        summary: { days: [] },
        plants: [{ plantId: 'p1', plantName: 'Fern', environment: 'indoor', advice: 'Dry week ahead', severity: 'info' }],
      },
      'p1',
    );
    expect(hint).toBe('Dry week ahead');
  });
});
