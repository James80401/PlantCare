import { inferGrowingEnvironment, type GrowingEnvironment } from '../care-guides/growing-environment';
import type { DailyForecastPoint, HourlyForecastPoint } from './weather-alerts';
import { buildWeatherAlerts, type WeatherAlert } from './weather-alerts';

export type PlantAdviceSeverity = 'info' | 'warning';

export interface PlantForWeatherAdvice {
  id: string;
  nickname?: string | null;
  location?: string | null;
  species: { commonName: string };
}

export interface PlantWeatherAdviceLine {
  plantId: string;
  plantName: string;
  environment: GrowingEnvironment;
  advice: string;
  severity: PlantAdviceSeverity;
}

export interface PlantWeatherAdviceResult {
  overviewAlerts: WeatherAlert[];
  plants: PlantWeatherAdviceLine[];
  summary: {
    days: Array<{
      date: string;
      tempMinC: number;
      tempMaxC: number;
      rainProbability: number;
    }>;
  };
}

const FROST_C = 0;
const HEAT_C = 35;

export function buildPlantWeatherAdvice(
  hourly: HourlyForecastPoint[],
  daily: DailyForecastPoint[],
  plants: PlantForWeatherAdvice[],
): PlantWeatherAdviceResult {
  const overviewAlerts = buildWeatherAlerts(hourly, daily);
  const plantLines = plants.map((plant) => buildLineForPlant(plant, hourly, daily));

  return {
    overviewAlerts,
    plants: plantLines,
    summary: {
      days: daily.map((day) => ({
        date: day.date,
        tempMinC: day.tempMinC,
        tempMaxC: day.tempMaxC,
        rainProbability: day.precipProbability,
      })),
    },
  };
}

function buildLineForPlant(
  plant: PlantForWeatherAdvice,
  hourly: HourlyForecastPoint[],
  daily: DailyForecastPoint[],
): PlantWeatherAdviceLine {
  const environment = inferGrowingEnvironment(plant.location);
  const plantName = plant.nickname?.trim() || plant.species.commonName;
  const tonightMin = minHourlyTemp(hourly.slice(0, 18));
  const tomorrow = daily[1];
  const dayAfter = daily[2];

  if (environment === 'outdoor' || environment === 'semi_outdoor') {
    if (tonightMin <= FROST_C) {
      return line(
        plant,
        environment,
        `Cold tonight (near ${Math.round(tonightMin)}°C) — move ${plantName} indoors or cover before sunset.`,
        'warning',
      );
    }
    if (tomorrow && tomorrow.tempMinC <= FROST_C) {
      return line(
        plant,
        environment,
        `Freeze risk tomorrow (low ~${Math.round(tomorrow.tempMinC)}°C) — shelter ${plantName} or insulate the pot.`,
        'warning',
      );
    }
    if (dayAfter && dayAfter.tempMinC <= FROST_C) {
      return line(
        plant,
        environment,
        `Cold snap ahead (low ~${Math.round(dayAfter.tempMinC)}°C in a few days) — plan cover or move for ${plantName}.`,
        'info',
      );
    }
    const hotDay = daily.slice(0, 4).find((day) => day.tempMaxC >= HEAT_C);
    if (hotDay) {
      return line(
        plant,
        environment,
        `Heat up to ~${Math.round(hotDay.tempMaxC)}°C expected — extra water checks and shade help for ${plantName}.`,
        'warning',
      );
    }
    if (tomorrow && tomorrow.precipProbability >= 0.55) {
      return line(
        plant,
        environment,
        `Rain likely tomorrow — skip outdoor watering for ${plantName} unless the soil is dry.`,
        'info',
      );
    }
  } else {
    if (tonightMin <= 2) {
      return line(
        plant,
        environment,
        `Cold night near windows (about ${Math.round(tonightMin)}°C) — pull ${plantName} back from cold glass.`,
        'info',
      );
    }
    const hotDay = daily.slice(0, 3).find((day) => day.tempMaxC >= HEAT_C);
    if (hotDay) {
      return line(
        plant,
        environment,
        `Hot spell (~${Math.round(hotDay.tempMaxC)}°C outside) — watch sunny sills and AC drafts for ${plantName}.`,
        'info',
      );
    }
  }

  const dryWeek = daily.slice(0, 5).every((day) => day.precipProbability < 0.2);
  if (dryWeek && (environment === 'outdoor' || environment === 'semi_outdoor')) {
    return line(
      plant,
      environment,
      `Dry week ahead — ${plantName} may need sooner water checks in sun and wind.`,
      'info',
    );
  }

  return line(
    plant,
    environment,
    `Weather looks calm this week for ${plantName} — keep your usual care rhythm.`,
    'info',
  );
}

function line(
  plant: PlantForWeatherAdvice,
  environment: GrowingEnvironment,
  advice: string,
  severity: PlantAdviceSeverity,
): PlantWeatherAdviceLine {
  return {
    plantId: plant.id,
    plantName: plant.nickname?.trim() || plant.species.commonName,
    environment,
    advice,
    severity,
  };
}

function minHourlyTemp(hourly: HourlyForecastPoint[]) {
  if (hourly.length === 0) return Infinity;
  return Math.min(...hourly.map((point) => point.tempC));
}
