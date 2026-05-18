import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { fetchOpenMeteoForecast, searchLocations, type GeocodeResult } from './open-meteo.client';
import { buildPlantWeatherAdvice } from './plant-weather-advice';
import type { WeatherAdvicePayload, WeatherAdviceStatusResponse } from './weather-advice.types';
import {
  buildLocationKey,
  getLocalDateKey,
  getNextLocalDayStart,
} from './weather-cache.util';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private prisma: PrismaService) {}

  searchLocations(query: string) {
    return searchLocations(query);
  }

  async geocodeLocation(query: string): Promise<GeocodeResult | null> {
    const results = await searchLocations(query, 1);
    return results[0] ?? null;
  }

  async getAdviceStatus(userId: string): Promise<WeatherAdviceStatusResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.latitude || !user?.longitude) {
      return {
        hasLocation: false,
        canFetchToday: false,
        fetchedAt: null,
        nextAvailableAt: null,
        locationLabel: null,
        cachedAdvice: null,
      };
    }

    const timezone = user.timezone || 'UTC';
    const locationKey = buildLocationKey(user.latitude, user.longitude);
    const localDateKey = getLocalDateKey(timezone);
    const cache = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });
    const cacheValid =
      cache &&
      cache.localDateKey === localDateKey &&
      cache.locationKey === locationKey;

    const cachedAdvice = cacheValid ? this.parsePayload(cache.payload) : null;

    return {
      hasLocation: true,
      canFetchToday: !cacheValid,
      fetchedAt: cacheValid ? cache!.fetchedAt.toISOString() : null,
      nextAvailableAt: cacheValid ? getNextLocalDayStart(timezone) : null,
      locationLabel: user.locationLabel,
      cachedAdvice,
    };
  }

  async fetchPlantAdvice(
    userId: string,
    options: { confirmed: boolean },
  ): Promise<WeatherAdvicePayload> {
    if (!options.confirmed) {
      throw new BadRequestException('Confirm to use your daily weather check.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.latitude || !user?.longitude) {
      throw new BadRequestException(
        'Add your city or address in Settings before requesting weather advice.',
      );
    }

    const timezone = user.timezone || 'UTC';
    const locationKey = buildLocationKey(user.latitude, user.longitude);
    const localDateKey = getLocalDateKey(timezone);
    const existing = await this.prisma.weatherAdviceCache.findUnique({ where: { userId } });

    if (
      existing &&
      existing.localDateKey === localDateKey &&
      existing.locationKey === locationKey
    ) {
      const cached = this.parsePayload(existing.payload);
      return { ...cached, fromCache: true };
    }

    const plants = await this.prisma.plant.findMany({
      where: { userId },
      select: {
        id: true,
        nickname: true,
        location: true,
        species: { select: { commonName: true } },
      },
    });

    try {
      const { hourly, daily, timezone: resolvedTz } = await fetchOpenMeteoForecast(
        user.latitude,
        user.longitude,
        timezone,
      );

      const built = buildPlantWeatherAdvice(hourly, daily, plants);
      const fetchedAt = new Date().toISOString();
      const payload: WeatherAdvicePayload = {
        fromCache: false,
        fetchedAt,
        locationLabel: user.locationLabel,
        timezone: resolvedTz,
        overviewAlerts: built.overviewAlerts,
        summary: built.summary,
        plants: built.plants,
      };

      await this.prisma.weatherAdviceCache.upsert({
        where: { userId },
        create: {
          userId,
          fetchedAt: new Date(fetchedAt),
          localDateKey,
          locationKey,
          payload: JSON.stringify(payload),
        },
        update: {
          fetchedAt: new Date(fetchedAt),
          localDateKey,
          locationKey,
          payload: JSON.stringify(payload),
        },
      });

      return payload;
    } catch (err) {
      this.logger.warn(`Open-Meteo plant advice failed: ${err}`);
      throw new BadRequestException('Could not fetch weather right now. Try again later.');
    }
  }

  async invalidateAdviceCache(userId: string) {
    await this.prisma.weatherAdviceCache.deleteMany({ where: { userId } });
  }

  private parsePayload(raw: string): WeatherAdvicePayload {
    return JSON.parse(raw) as WeatherAdvicePayload;
  }
}
