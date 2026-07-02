import {
  RecommendationPriority,
  RecommendationSource,
  RecommendationStatus,
  TaskStatus,
  TaskType,
} from '@prisma/client';
import { RecommendationsService } from './recommendations.service';

describe('RecommendationsService', () => {
  const plant = {
    id: 'plant-1',
    userId: 'user-1',
    gardenId: 'garden-1',
    speciesId: 'species-1',
    nickname: 'Mona',
    location: 'Indoor',
    potSize: 'MEDIUM',
    lifeStage: 'ESTABLISHED',
    approximateAgeMonths: null,
    datePlanted: null,
    imageUrl: null,
    notes: null,
    createdAt: new Date('2026-05-01T12:00:00.000Z'),
    updatedAt: new Date('2026-05-01T12:00:00.000Z'),
    species: {
      id: 'species-1',
      commonName: 'Monstera',
      scientificName: 'Monstera deliciosa',
      sunlight: 'Bright indirect',
      wateringFreqDays: 7,
      toxicity: 'Toxic to pets',
      phMin: null,
      phMax: null,
      careNotes: 'Tropical foliage plant.',
      defaultImageUrl: null,
      metadataJson: null,
      perenualId: null,
      createdAt: new Date('2026-05-01T12:00:00.000Z'),
      updatedAt: new Date('2026-05-01T12:00:00.000Z'),
    },
    garden: { id: 'garden-1', name: 'Home', location: 'Indoor' },
    progressEntries: [],
  };

  function createService(overrides: Record<string, unknown> = {}) {
    const recommendationRows: Record<string, any> = {};
    const prisma = {
      plant: {
        findMany: jest.fn().mockResolvedValue([plant]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'plant-1',
          userId: 'user-1',
          gardenId: 'garden-1',
          shares: [],
          garden: { members: [] },
        }),
      },
      recommendation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(({ where }) =>
          Promise.resolve(recommendationRows[where.userId_sourceKey.sourceKey] ?? null),
        ),
        upsert: jest.fn(({ where, create, update }) => {
          const key = where.userId_sourceKey.sourceKey;
          recommendationRows[key] = {
            ...(recommendationRows[key] ?? create),
            ...update,
            id: recommendationRows[key]?.id ?? key,
            userId: where.userId_sourceKey.userId,
            sourceKey: key,
          };
          return Promise.resolve(recommendationRows[key]);
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'rec-1',
          userId: 'user-1',
          plantId: 'plant-1',
          gardenId: 'garden-1',
          suggestedTaskType: TaskType.HEALTH_CHECK,
          suggestedTaskDueInDays: 1,
          metadataJson: null,
        }),
        update: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
      },
      task: {
        create: jest.fn().mockResolvedValue({ id: 'task-1' }),
      },
      ...overrides,
    };
    return { service: new RecommendationsService(prisma as never), prisma };
  }

  it('generates due plant check-in and flush recommendations', async () => {
    const { service, prisma } = createService();

    await service.refreshForUser('user-1', new Date('2026-07-02T12:00:00.000Z'));

    expect(prisma.recommendation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          source: RecommendationSource.PLANT_CHECK_IN,
          priority: RecommendationPriority.MEDIUM,
          title: 'Check in on Mona',
          status: RecommendationStatus.ACTIVE,
        }),
      }),
    );
    expect(prisma.recommendation.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          sourceKey: 'flush-soil:plant-1:2026-06-30',
          source: RecommendationSource.CARE_TIMING,
        }),
      }),
    );
  });

  it('snoozes a recommendation until the next local day', async () => {
    const { service, prisma } = createService();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-02T12:00:00.000Z'));

    try {
      await service.snoozeUntilTomorrow('user-1', 'rec-1');

      expect(prisma.recommendation.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: {
          status: RecommendationStatus.SNOOZED,
          snoozedUntil: new Date('2026-07-03T00:00:00.000Z'),
        },
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('converts explicit task-backed recommendations into pending tasks', async () => {
    const { service, prisma } = createService();

    await service.convertToTask('user-1', 'rec-1');

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plantId: 'plant-1',
          gardenId: 'garden-1',
          taskType: TaskType.HEALTH_CHECK,
          status: TaskStatus.PENDING,
        }),
      }),
    );
    expect(prisma.recommendation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: RecommendationStatus.DONE,
        }),
      }),
    );
  });
});
