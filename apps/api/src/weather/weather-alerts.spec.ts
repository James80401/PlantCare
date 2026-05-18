import { buildWeatherAlerts } from './weather-alerts';

describe('buildWeatherAlerts', () => {
  it('warns when overnight hourly temps hit freezing', () => {
    const hourly = Array.from({ length: 12 }, (_, index) => ({
      time: `2026-01-1${index}T0${index}:00`,
      tempC: index < 6 ? -1 : 4,
      precipProbability: 0,
    }));

    const alerts = buildWeatherAlerts(hourly, [
      { date: '2026-01-10', tempMinC: 2, tempMaxC: 8, precipProbability: 0.1 },
      { date: '2026-01-11', tempMinC: 5, tempMaxC: 9, precipProbability: 0.1 },
    ]);

    expect(alerts.some((alert) => alert.type === 'frost' && alert.when === 'tonight')).toBe(true);
  });

  it('warns for tomorrow freeze without duplicating tonight frost', () => {
    const alerts = buildWeatherAlerts(
      [{ time: '2026-01-10T12:00', tempC: 5, precipProbability: 0 }],
      [
        { date: '2026-01-10', tempMinC: 4, tempMaxC: 10, precipProbability: 0.1 },
        { date: '2026-01-11', tempMinC: -2, tempMaxC: 3, precipProbability: 0.1 },
      ],
    );

    expect(alerts.some((alert) => alert.when === 'tomorrow' && alert.type === 'frost')).toBe(true);
  });
});
