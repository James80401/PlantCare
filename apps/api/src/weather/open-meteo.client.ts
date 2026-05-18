import axios from 'axios';
import type { DailyForecastPoint, HourlyForecastPoint } from './weather-alerts';

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  label: string;
  timezone: string;
}

interface GeocodeApiResult {
  results?: Array<{
    name: string;
    admin1?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  }>;
}

interface ForecastApiResult {
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_min?: number[];
    temperature_2m_max?: number[];
    precipitation_probability_max?: number[];
  };
}

export async function searchLocations(query: string, count = 6): Promise<GeocodeResult[]> {
  const { data } = await axios.get<GeocodeApiResult>(
    'https://geocoding-api.open-meteo.com/v1/search',
    {
      params: { name: query.trim(), count, language: 'en', format: 'json' },
      timeout: 8000,
    },
  );

  return (data.results ?? []).map((item) => ({
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
    label: [item.name, item.admin1, item.country].filter(Boolean).join(', '),
  }));
}

export async function fetchOpenMeteoForecast(
  latitude: number,
  longitude: number,
  timezone?: string,
): Promise<{ hourly: HourlyForecastPoint[]; daily: DailyForecastPoint[]; timezone: string }> {
  const { data } = await axios.get<ForecastApiResult & { timezone?: string }>(
    'https://api.open-meteo.com/v1/forecast',
    {
      params: {
        latitude,
        longitude,
        timezone: timezone || 'auto',
        forecast_days: 7,
        hourly: 'temperature_2m,precipitation_probability',
        daily: 'temperature_2m_min,temperature_2m_max,precipitation_probability_max',
      },
      timeout: 10000,
    },
  );

  const hourly: HourlyForecastPoint[] = (data.hourly?.time ?? []).map((time, index) => ({
    time,
    tempC: data.hourly?.temperature_2m?.[index] ?? 0,
    precipProbability: (data.hourly?.precipitation_probability?.[index] ?? 0) / 100,
  }));

  const daily: DailyForecastPoint[] = (data.daily?.time ?? []).map((date, index) => ({
    date,
    tempMinC: data.daily?.temperature_2m_min?.[index] ?? 0,
    tempMaxC: data.daily?.temperature_2m_max?.[index] ?? 0,
    precipProbability: (data.daily?.precipitation_probability_max?.[index] ?? 0) / 100,
  }));

  return {
    hourly,
    daily,
    timezone: data.timezone || timezone || 'UTC',
  };
}
