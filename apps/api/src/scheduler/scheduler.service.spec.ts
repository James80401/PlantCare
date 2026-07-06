import { PlantLifeStage, PotSize, TaskStatus, TaskType } from '@prisma/client';
import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  let service: SchedulerService;

  beforeEach(() => {
    service = new SchedulerService({} as never);
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('starts generated recurring dates after the first interval', () => {
    const start = new Date('2025-01-01T12:00:00.000Z');
    const dates = service.generateRecurringDates(start, 7, 3);
    expect(dates.map((date) => date.toISOString().slice(0, 10))).toEqual([
      '2025-01-08',
      '2025-01-15',
      '2025-01-22',
    ]);
  });

  it('detects growing season', () => {
    expect(service.isGrowingSeason(new Date('2025-06-15'))).toBe(true);
    expect(service.isGrowingSeason(new Date('2025-12-15'))).toBe(false);
  });

  it('schedules extended care types including repot within 90 days', async () => {
    const created: { taskType: TaskType; dueDate: Date }[] = [];
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-05T12:00:00.000Z'));
    const prisma = {
      plant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plant-1',
          gardenId: 'garden-1',
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
    expect(types.has(TaskType.HEALTH_CHECK)).toBe(false);

    const repot = created.find((t) => t.taskType === TaskType.REPOT);
    expect(repot).toBeDefined();
    const daysUntilRepot =
      (repot!.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilRepot).toBeLessThanOrEqual(90);

    const firstDueDateByType = (taskType: TaskType) =>
      created
        .filter((task) => task.taskType === taskType)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]
        ?.dueDate.toISOString()
        .slice(0, 10);

    expect(firstDueDateByType(TaskType.WATER)).toBe('2026-07-12');
    expect(firstDueDateByType(TaskType.PRUNE)).toBe('2026-08-04');
    expect(firstDueDateByType(TaskType.FERTILIZE)).toBe('2026-08-04');
    expect(firstDueDateByType(TaskType.ROTATE)).toBe('2026-07-19');
    expect(firstDueDateByType(TaskType.CLEAN_LEAVES)).toBe('2026-07-26');
    expect(firstDueDateByType(TaskType.INSPECT_PESTS)).toBe('2026-07-12');
    expect(firstDueDateByType(TaskType.REPOT)).toBe('2026-09-03');
    expect(
      created.some(
        (task) =>
          task.taskType !== TaskType.REPOT &&
          task.dueDate.toISOString().slice(0, 10) === '2026-07-05',
      ),
    ).toBe(false);
  });

  it('uses plant life stage to protect seedlings from harsh care tasks', async () => {
    const created: { taskType: TaskType; dueDate: Date }[] = [];
    const prisma = {
      plant: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'plant-1',
          gardenId: 'garden-1',
          location: 'Indoor',
          potSize: PotSize.MEDIUM,
          lifeStage: PlantLifeStage.SEEDLING,
          approximateAgeMonths: 1,
          datePlanted: null,
          species: {
            commonName: 'Basil',
            scientificName: 'Ocimum basilicum',
            wateringFreqDays: 7,
            careNotes: 'Tender herb',
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
    expect(types.has(TaskType.FERTILIZE)).toBe(false);
    expect(types.has(TaskType.REPOT)).toBe(false);
    expect(types.has(TaskType.CHECK_MOISTURE)).toBe(true);

    const moistureDates = created
      .filter((t) => t.taskType === TaskType.CHECK_MOISTURE)
      .map((t) => t.dueDate.getTime());
    expect(moistureDates[1] - moistureDates[0]).toBe(3 * 24 * 60 * 60 * 1000);
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

  it('suggests a heat stress moisture check for outdoor plants', async () => {
    const payload = {
      summary: {
        days: [
          { date: '2026-06-01', tempMinC: 22, tempMaxC: 30, rainProbability: 0.1 },
          { date: '2026-06-02', tempMinC: 24, tempMaxC: 37, rainProbability: 0.1 },
          { date: '2026-06-03', tempMinC: 23, tempMaxC: 34, rainProbability: 0.1 },
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
            nickname: 'Patio Basil',
            location: 'Outdoor patio',
            species: { commonName: 'Basil' },
          },
          {
            id: 'plant-2',
            nickname: 'Desk Fern',
            location: 'Office desk',
            species: { commonName: 'Fern' },
          },
        ]),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);

    const suggestions = await service.getScheduleSuggestionsForUser('user-1');

    expect(suggestions).toEqual([
      expect.objectContaining({
        id: 'plant-1:heat-moisture-check',
        taskType: TaskType.CHECK_MOISTURE,
        title: 'Add heat stress moisture check',
        affectedTaskCount: 1,
        adjustmentDays: 0,
      }),
    ]);
  });

  it('suggests a frost protection check for outdoor plants', async () => {
    const payload = {
      summary: {
        days: [
          { date: '2026-01-10', tempMinC: 5, tempMaxC: 12, rainProbability: 0.1 },
          { date: '2026-01-11', tempMinC: -1, tempMaxC: 8, rainProbability: 0.1 },
          { date: '2026-01-12', tempMinC: 2, tempMaxC: 10, rainProbability: 0.1 },
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
            nickname: 'Porch Rosemary',
            location: 'Front porch outside',
            species: { commonName: 'Rosemary' },
          },
        ]),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new SchedulerService(prisma as never);

    const suggestions = await service.getScheduleSuggestionsForUser('user-1');

    expect(suggestions).toEqual([
      expect.objectContaining({
        id: 'plant-1:frost-protection-check',
        taskType: TaskType.HEALTH_CHECK,
        title: 'Add frost protection check',
        affectedTaskCount: 1,
        adjustmentDays: 0,
      }),
    ]);
  });

  it('does not suggest duplicate heat checks already pending on the forecast day', async () => {
    const payload = {
      summary: {
        days: [{ date: '2026-06-01', tempMinC: 22, tempMaxC: 37, rainProbability: 0.1 }],
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
            nickname: 'Patio Basil',
            location: 'Outdoor patio',
            species: { commonName: 'Basil' },
          },
        ]),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([{ id: 'existing-heat-check' }]),
      },
    };
    service = new SchedulerService(prisma as never);

    await expect(service.getScheduleSuggestionsForUser('user-1')).resolves.toEqual([]);
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

  it('applies a heat moisture suggestion by creating one pending task', async () => {
    const payload = {
      summary: {
        days: [{ date: '2026-06-01', tempMinC: 22, tempMaxC: 37, rainProbability: 0.1 }],
      },
    };
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'plant-1', gardenId: 'garden-1' }),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue({ payload: JSON.stringify(payload) }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args) => Promise.resolve({ id: 'task-heat', ...args.data })),
      },
    };
    service = new SchedulerService(prisma as never);

    const result = await service.applyScheduleSuggestion('user-1', 'plant-1:heat-moisture-check');

    expect(result.applied).toBe(true);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plantId: 'plant-1',
        gardenId: 'garden-1',
        taskType: TaskType.CHECK_MOISTURE,
        status: TaskStatus.PENDING,
      }),
    });
  });

  it('applies a frost protection suggestion by creating one pending health check', async () => {
    const payload = {
      summary: {
        days: [{ date: '2026-01-11', tempMinC: -1, tempMaxC: 8, rainProbability: 0.1 }],
      },
    };
    const prisma = {
      plant: {
        findFirst: jest.fn().mockResolvedValue({ id: 'plant-1', gardenId: 'garden-1' }),
      },
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue({ payload: JSON.stringify(payload) }),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn((args) => Promise.resolve({ id: 'task-frost', ...args.data })),
      },
    };
    service = new SchedulerService(prisma as never);

    const result = await service.applyScheduleSuggestion('user-1', 'plant-1:frost-protection-check');

    expect(result.applied).toBe(true);
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        plantId: 'plant-1',
        gardenId: 'garden-1',
        taskType: TaskType.HEALTH_CHECK,
        status: TaskStatus.PENDING,
      }),
    });
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

  it('postpones outdoor watering for all plants in one batched transaction (no N+1)', async () => {
    const rainyPayload = {
      summary: {
        days: [
          { rainProbability: 0.1 },
          { rainProbability: 0.8 },
          { rainProbability: 0.7 },
        ],
      },
    };
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-20T12:00:00Z'));
    const tomorrow = new Date('2026-05-21T09:00:00Z');

    const prisma = {
      weatherAdviceCache: {
        findUnique: jest.fn().mockResolvedValue({ payload: JSON.stringify(rainyPayload) }),
      },
      plant: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'plant-1', location: 'Backyard garden' },
          { id: 'plant-2', location: 'Patio (outdoor)' },
          { id: 'plant-3', location: 'Living room' }, // indoor — excluded
        ]),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'task-a', dueDate: tomorrow },
          { id: 'task-b', dueDate: tomorrow },
          { id: 'task-c', dueDate: tomorrow },
        ]),
        update: jest.fn((args) => args),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    service = new SchedulerService(prisma as never);

    await service.autoPostponeOutdoorWateringFromWeather('user-batch');

    // Tasks fetched in ONE query scoped to the outdoor plant IDs (indoor excluded).
    expect(prisma.task.findMany).toHaveBeenCalledTimes(1);
    const whereArg = prisma.task.findMany.mock.calls[0][0].where;
    expect(whereArg.plantId).toEqual({ in: ['plant-1', 'plant-2'] });
    // All updates flushed in a SINGLE transaction (not N sequential awaits).
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction.mock.calls[0][0]).toHaveLength(3);

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
