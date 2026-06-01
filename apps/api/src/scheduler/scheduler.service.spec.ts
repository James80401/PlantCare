import { PotSize, TaskStatus, TaskType } from '@prisma/client';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    service = new SchedulerService({} as never);
  });

  it('calculates water interval with pot multiplier', () => {
    expect(service.getWaterIntervalDays(7, PotSize.SMALL)).toBe(6);
    expect(service.getWaterIntervalDays(7, PotSize.LARGE)).toBe(8);
  });

  it('generates correct number of dates', () => {
    const start = new Date('2025-01-01');
    const dates = service.generateDates(start, 7, 3);
    expect(dates).toHaveLength(3);
    expect(dates[1].getTime() - dates[0].getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('detects growing season', () => {
    expect(service.isGrowingSeason(new Date('2025-06-15'))).toBe(true);
    expect(service.isGrowingSeason(new Date('2025-12-15'))).toBe(false);
  });

  it('schedules extended care types including repot within 90 days', async () => {
    const created: { taskType: TaskType; dueDate: Date }[] = [];
    const prisma = {
      plant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plant-1',
          location: 'Living Room',
          potSize: PotSize.MEDIUM,
          datePlanted: null,
          species: {
            commonName: 'Monstera',
            scientificName: 'Monstera deliciosa',
            wateringFreqDays: 7,
            careNotes: 'Tropical foliage',
          },
          user: { defaultLightLevel: 'medium' },
        }),
      },
      task: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockImplementation(({ data }) => {
          created.push(...data);
          return { count: data.length };
        }),
      },
    };
    service = new SchedulerService(prisma as never);

    await service.generateTasksForPlant('plant-1');

    const types = new Set(created.map((t) => t.taskType));
    expect(types.has(TaskType.WATER)).toBe(true);
    expect(types.has(TaskType.FERTILIZE)).toBe(true);
    expect(types.has(TaskType.REPOT)).toBe(true);
    expect(types.has(TaskType.ROTATE)).toBe(true);
    expect(types.has(TaskType.INSPECT_PESTS)).toBe(true);

    const repot = created.find((t) => t.taskType === TaskType.REPOT);
    expect(repot).toBeDefined();
    const daysUntilRepot =
      (repot!.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilRepot).toBeLessThanOrEqual(90);
  });

  it('suggests watering less often after repeated wet-soil skips', async () => {
    const prisma = {
      taskFeedback: {
        findMany: jest.fn().mockResolvedValue([
          feedback('feedback-1', 'SOIL_STILL_WET'),
          feedback('feedback-2', 'SOIL_STILL_WET'),
        ]),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      task: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'task-next-1' }, { id: 'task-next-2' }])
          .mockResolvedValueOnce([]),
      },
    };
    service = new SchedulerService(prisma as never);

    const suggestions = await service.getScheduleSuggestionsForUser('user-1');

    expect(suggestions).toEqual([
      expect.objectContaining({
        id: 'plant-1:water-extend',
        title: 'Water less often',
        affectedTaskCount: 2,
        adjustmentDays: 2,
      }),
    ]);
  });

  it('preserves existing scheduling behavior when there is no feedback', async () => {
    const prisma = {
      taskFeedback: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);

    await expect(service.getScheduleSuggestionsForUser('user-1')).resolves.toEqual([]);
  });

  it('applies a water-extension suggestion by shifting pending tasks', async () => {
    const firstDue = new Date('2026-05-17T00:00:00.000Z');
    const secondDue = new Date('2026-05-24T00:00:00.000Z');
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'plant-1' }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'task-1', dueDate: firstDue },
          { id: 'task-2', dueDate: secondDue },
        ]),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, dueDate: args.data.dueDate })),
      },
    };
    service = new SchedulerService(prisma as never);

    const result = await service.applyScheduleSuggestion('user-1', 'plant-1:water-extend');

    expect(result.applied).toBe(true);
    expect(prisma.task.update).toHaveBeenCalledTimes(2);
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { dueDate: new Date('2026-05-19T00:00:00.000Z') },
    });
  });

  it('suggests watering more often after repeated dry-soil completions', async () => {
    const prisma = {
      taskFeedback: {
        findMany: jest.fn().mockResolvedValue([
          feedbackComplete('complete-1', 'SOIL_VERY_DRY'),
          feedbackComplete('complete-2', 'SOIL_VERY_DRY'),
        ]),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      task: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'task-next-1' }, { id: 'task-next-2' }])
          .mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);

    const suggestions = await service.getScheduleSuggestionsForUser('user-1');

    expect(suggestions).toEqual([
      expect.objectContaining({
        id: 'plant-1:water-accelerate',
        title: 'Water more often',
        affectedTaskCount: 2,
        adjustmentDays: -2,
      }),
    ]);
  });

  it('suggests delaying outdoor watering when rain is forecast', async () => {
    const payload = {
      summary: {
        days: [
          { date: '2026-05-26', tempMinC: 10, tempMaxC: 20, rainProbability: 0.2 },
          { date: '2026-05-27', tempMinC: 11, tempMaxC: 21, rainProbability: 0.75 },
          { date: '2026-05-28', tempMinC: 12, tempMaxC: 22, rainProbability: 0.3 },
        ],
      },
    };

    const prisma = {
      taskFeedback: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue({ payload: JSON.stringify(payload) }),
      },
      plant: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'plant-1',
            nickname: 'Outdoor Basil',
            location: 'Garden shed',
            species: { commonName: 'Basil' },
          },
        ]),
      },
      task: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'task-rain-delay-1' }])
          .mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);

    const suggestions = await service.getScheduleSuggestionsForUser('user-1');

    expect(suggestions).toEqual([
      expect.objectContaining({
        id: 'plant-1:water-rain-delay',
        title: 'Delay outdoor watering (forecast)',
        adjustmentDays: 2,
        affectedTaskCount: 1,
      }),
    ]);
  });

  it('applies a water-acceleration suggestion by shifting pending tasks earlier', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T12:00:00.000Z'));

    const firstDue = new Date('2026-05-17T00:00:00.000Z');
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'plant-1' }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([{ id: 'task-1', dueDate: firstDue }]),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, dueDate: args.data.dueDate })),
      },
    };
    service = new SchedulerService(prisma as never);

    const result = await service.applyScheduleSuggestion('user-1', 'plant-1:water-accelerate');

    expect(result.applied).toBe(true);
    const updateArg = prisma.task.update.mock.calls[0][0];
    expect(updateArg).toEqual({
      where: { id: 'task-1' },
      data: { dueDate: updateArg.data.dueDate },
    });
    expect(updateArg.data.dueDate.toISOString().slice(0, 10)).toBe('2026-05-15');

    jest.useRealTimers();
  });

  it('trims stale entries from the weather-postpone dedup map across a day boundary', async () => {
    const prisma = {
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue({ payload: '{}' }),
      },
      plant: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);
    const map: Map<string, string> = (service as unknown as {
      weatherPostponeRunByUser: Map<string, string>;
    }).weatherPostponeRunByUser;

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-14T12:00:00Z'));
    await service.autoPostponeOutdoorWateringFromWeather('user-1');
    await service.autoPostponeOutdoorWateringFromWeather('user-2');
    expect(map.size).toBe(2);

    jest.setSystemTime(new Date('2026-05-15T12:00:00Z'));
    await service.autoPostponeOutdoorWateringFromWeather('user-3');
    expect(map.size).toBe(1);
    expect(map.has('user-3')).toBe(true);
    expect(map.has('user-1')).toBe(false);
    expect(map.has('user-2')).toBe(false);

    jest.useRealTimers();
  });
});

function feedback(id: string, reason: string) {
  return {
    id,
    reason,
    action: 'SKIP',
    task: {
      id: `${id}-task`,
      plantId: 'plant-1',
      taskType: TaskType.WATER,
      status: TaskStatus.SKIPPED,
      plant: {
        id: 'plant-1',
        nickname: 'Kitchen Basil',
        location: 'Kitchen window',
        species: {
          commonName: 'Basil',
          wateringFreqDays: 3,
        },
      },
    },
  };
}

function feedbackComplete(id: string, reason: string) {
  return {
    id,
    reason,
    action: 'COMPLETE',
    task: {
      id: `${id}-task`,
      plantId: 'plant-1',
      taskType: TaskType.WATER,
      status: TaskStatus.DONE,
      plant: {
        id: 'plant-1',
        nickname: 'Kitchen Basil',
        location: 'Kitchen window',
        species: {
          commonName: 'Basil',
          wateringFreqDays: 3,
        },
      },
    },
  };
}
