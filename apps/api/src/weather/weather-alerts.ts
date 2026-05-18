export type WeatherAlertType = 'frost' | 'heat' | 'rain' | 'dry_spell';
export type WeatherAlertSeverity = 'info' | 'warning';

export interface WeatherAlert {
  type: WeatherAlertType;
  severity: WeatherAlertSeverity;
  title: string;
  message: string;
  when: 'tonight' | 'tomorrow' | 'next_few_days';
}

export interface HourlyForecastPoint {
  time: string;
  tempC: number;
  precipProbability: number;
}

export interface DailyForecastPoint {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  precipProbability: number;
}

const FROST_C = 0;
const HEAT_C = 35;

export function buildWeatherAlerts(
  hourly: HourlyForecastPoint[],
  daily: DailyForecastPoint[],
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const tonightHours = hourly.slice(0, 18);
  const tonightMin = minTemp(tonightHours);

  if (tonightHours.length > 0 && tonightMin <= FROST_C) {
    alerts.push({
      type: 'frost',
      severity: 'warning',
      title: 'Cold tonight',
      message: `Temperatures may drop to ${Math.round(tonightMin)}°C tonight. Move tender outdoor plants inside or cover them before sunset.`,
      when: 'tonight',
    });
  }

  const tomorrow = daily[1];
  if (tomorrow && tomorrow.tempMinC <= FROST_C) {
    alerts.push({
      type: 'frost',
      severity: 'warning',
      title: 'Freeze risk tomorrow',
      message: `Overnight lows near ${Math.round(tomorrow.tempMinC)}°C are expected tomorrow. Protect outdoor pots and tropical plants.`,
      when: 'tomorrow',
    });
  } else {
    const soonFrost = daily.slice(2, 4).find((day) => day.tempMinC <= FROST_C);
    if (soonFrost) {
      alerts.push({
        type: 'frost',
        severity: 'info',
        title: 'Cold snap ahead',
        message: `Lows near ${Math.round(soonFrost.tempMinC)}°C are forecast in the next few days. Plan to shelter sensitive plants.`,
        when: 'next_few_days',
      });
    }
  }

  const tomorrowRain = tomorrow?.precipProbability ?? 0;
  if (tomorrowRain >= 0.55) {
    alerts.push({
      type: 'rain',
      severity: 'info',
      title: 'Rain tomorrow',
      message:
        'Rain is likely tomorrow. Outdoor watering may not be needed — check soil before you water.',
      when: 'tomorrow',
    });
  }

  const hotDay = daily.slice(0, 3).find((day) => day.tempMaxC >= HEAT_C);
  if (hotDay) {
    alerts.push({
      type: 'heat',
      severity: 'warning',
      title: 'Heat stress risk',
      message: `Highs around ${Math.round(hotDay.tempMaxC)}°C are forecast. Extra water checks help for outdoor plants and sunny windows.`,
      when: hotDay === daily[0] ? 'tonight' : 'next_few_days',
    });
  }

  const dryWindow = daily.slice(0, 5).every((day) => day.precipProbability < 0.2);
  if (dryWindow && daily.length >= 3) {
    alerts.push({
      type: 'dry_spell',
      severity: 'info',
      title: 'Dry stretch',
      message:
        'Little rain is forecast this week. Containers and outdoor beds may dry out faster than usual.',
      when: 'next_few_days',
    });
  }

  return dedupeAlerts(alerts);
}

function minTemp(hourly: HourlyForecastPoint[]) {
  if (hourly.length === 0) return Infinity;
  return Math.min(...hourly.map((point) => point.tempC));
}

function dedupeAlerts(alerts: WeatherAlert[]) {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = `${alert.type}:${alert.when}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
