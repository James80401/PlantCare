import { buildPlantWeatherAdvice } from './plant-weather-advice';

describe('buildPlantWeatherAdvice', () => {
  const outdoorPlant = {
    id: 'p1',
    nickname: 'Porch Monstera',
    location: 'Patio',
    species: { commonName: 'Monstera' },
  };

  const indoorPlant = {
    id: 'p2',
    nickname: 'Desk Pothos',
    location: 'Living Room',
    species: { commonName: 'Pothos' },
  };

  it('warns outdoor plants about frost tonight', () => {
    const hourly = Array.from({ length: 12 }, (_, index) => ({
      time: `2026-01-10T${String(index).padStart(2, '0')}:00`,
      tempC: index < 6 ? -2 : 5,
      precipProbability: 0,
    }));
    const daily = [
      { date: '2026-01-10', tempMinC: 0, tempMaxC: 8, precipProbability: 0.1 },
      { date: '2026-01-11', tempMinC: 4, tempMaxC: 9, precipProbability: 0.1 },
    ];

    const result = buildPlantWeatherAdvice(hourly, daily, [outdoorPlant]);
    expect(result.plants[0].severity).toBe('warning');
    expect(result.plants[0].advice).toMatch(/Cold tonight/i);
    expect(result.overviewAlerts.some((alert) => alert.type === 'frost')).toBe(true);
  });

  it('gives calmer copy for indoor plants in mild weather', () => {
    const hourly = [{ time: '2026-05-10T12:00', tempC: 18, precipProbability: 0 }];
    const daily = [
      { date: '2026-05-10', tempMinC: 12, tempMaxC: 22, precipProbability: 0.1 },
      { date: '2026-05-11', tempMinC: 13, tempMaxC: 23, precipProbability: 0.1 },
    ];

    const result = buildPlantWeatherAdvice(hourly, daily, [indoorPlant]);
    expect(result.plants[0].advice).toMatch(/calm this week/i);
  });
});
