import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherService } from './weather.service';
import * as openMeteo from './open-meteo.client';

jest.mock('./open-meteo.client');

describe('WeatherService', () => {
  let service: WeatherService;
  const prisma = {
    user: { findUnique: jest.fn() },
    plant: { findMany: jest.fn() },
    weatherAdviceCache: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(WeatherService);
  });

  it('requires confirmation before fetching advice', async () => {
    await expect(service.fetchPlantAdvice('user-1', { confirmed: false })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns cached advice on second call the same day', async () => {
    const cachedPayload = {
      fromCache: false,
      fetchedAt: '2026-05-18T12:00:00.000Z',
      locationLabel: 'Seattle',
      timezone: 'America/Los_Angeles',
      overviewAlerts: [],
      summary: { days: [] },
      plants: [],
    };

    prisma.user.findUnique.mockResolvedValue({
      latitude: 47.6,
      longitude: -122.3,
      timezone: 'America/Los_Angeles',
      locationLabel: 'Seattle',
    });
    prisma.weatherAdviceCache.findUnique.mockResolvedValue({
      userId: 'user-1',
      localDateKey: new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
      }).format(new Date()),
      locationKey: '47.60,-122.30',
      payload: JSON.stringify(cachedPayload),
      fetchedAt: new Date('2026-05-18T12:00:00.000Z'),
    });

    const result = await service.fetchPlantAdvice('user-1', { confirmed: true });
    expect(result.fromCache).toBe(true);
    expect(openMeteo.fetchOpenMeteoForecast).not.toHaveBeenCalled();
  });
});
