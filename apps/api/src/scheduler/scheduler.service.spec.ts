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
