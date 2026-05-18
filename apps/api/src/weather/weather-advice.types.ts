import type { WeatherAlert } from './weather-alerts';
import type { PlantWeatherAdviceLine } from './plant-weather-advice';

export interface WeatherAdvicePayload {
  fromCache: boolean;
  fetchedAt: string;
  locationLabel: string | null;
  timezone: string;
  overviewAlerts: WeatherAlert[];
  summary: {
    days: Array<{
      date: string;
      tempMinC: number;
      tempMaxC: number;
      rainProbability: number;
    }>;
  };
  plants: PlantWeatherAdviceLine[];
}

export interface WeatherAdviceStatusResponse {
  hasLocation: boolean;
  canFetchToday: boolean;
  fetchedAt: string | null;
  nextAvailableAt: string | null;
  locationLabel: string | null;
  cachedAdvice: WeatherAdvicePayload | null;
}
