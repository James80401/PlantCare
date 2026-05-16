import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string | undefined;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private scheduler: SchedulerService,
  ) {
    this.apiKey = this.config.get<string>('OPENWEATHER_API_KEY');
  }

  async getForecastForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.latitude || !user?.longitude) {
      return { message: 'Set your location in notification settings for weather features.' };
    }

    if (!this.apiKey) {
      return {
        demo: true,
        forecast: [
          { date: new Date().toISOString(), rainProbability: 0.2, temp: 22 },
        ],
      };
    }

    try {
      const { data } = await axios.get(
        'https://api.openweathermap.org/data/2.5/forecast',
        {
          params: {
            lat: user.latitude,
            lon: user.longitude,
            appid: this.apiKey,
            units: 'metric',
          },
          timeout: 8000,
        },
      );

      const daily = (data.list || []).slice(0, 8).map((item: { dt: number; pop: number; main: { temp: number } }) => ({
        date: new Date(item.dt * 1000).toISOString(),
        rainProbability: item.pop,
        temp: item.main.temp,
      }));

      const rainyTomorrow = daily[1]?.rainProbability > 0.5;
      if (rainyTomorrow) {
        const plants = await this.prisma.plant.findMany({ where: { userId } });
        for (const plant of plants) {
          await this.scheduler.postponeWateringForRain(plant.id, 2);
        }
      }

      return { forecast: daily, rainSkipApplied: rainyTomorrow };
    } catch (err) {
      this.logger.warn(`Weather API failed: ${err}`);
      return { error: 'Could not fetch weather' };
    }
  }
}
