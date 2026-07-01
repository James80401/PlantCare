import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  const task = {
    id: 'task-1',
    plantId: 'plant-1',
    taskType: 'WATER',
    dueDate: new Date('2026-05-17'),
    status: TaskStatus.PENDING,
  };

  const taskWithPlant = {
    ...task,
    plant: {
      userId: 'user-1',
      shares: [] as Array<{
        canComplete: boolean;
        garden: { members: Array<{ userId: string; role: string }> };
      }>,
    },
  };

  function createService(taskResult: unknown = taskWithPlant) {
    const tx = {
      task: {
        update: jest.fn().mockResolvedValue({
          ...task,
          status: TaskStatus.SKIPPED,
          completedAt: new Date('2026-05-17T12:00:00.000Z'),
          plant: { species: { commonName: 'Monstera' } },
        }),
      },
      taskFeedback: {
        create: jest.fn().mockResolvedValue({ id: 'feedback-1' }),
      },
    };

    const prisma = {
      task: {
        findFirst: jest.fn().mockResolvedValue(taskResult),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };

    const scheduler = {
      onTaskCompleted: jest.fn().mockResolvedValue(undefined),
    };

    const service = new TasksService(prisma as never, scheduler as never, {} as never, {
      emit: jest.fn(),
    } as never);

    return { service, prisma, scheduler, tx };
  }

  it('skips a task without requiring feedback', async () => {
    const { service, scheduler, tx } = createService();

    const result = await service.skip('user-1', 'task-1');

    expect(result.status).toBe(TaskStatus.SKIPPED);
    expect(tx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({ status: TaskStatus.SKIPPED }),
      }),
    );
    expect(tx.taskFeedback.create).not.toHaveBeenCalled();
    expect(scheduler.onTaskCompleted).toHaveBeenCalledWith('task-1');
  });

  it('persists skip feedback when a reason is provided', async () => {
    const { service, tx } = createService();

    await service.skip('user-1', 'task-1', {
      reason: 'SOIL_STILL_WET',
      note: ' Still damp near the roots. ',
    });

    expect(tx.taskFeedback.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        userId: 'user-1',
        action: 'SKIP',
        reason: 'SOIL_STILL_WET',
        note: 'Still damp near the roots.',
      },
    });
  });

  it('persists completion feedback when a reason is provided', async () => {
    const { service, tx } = createService();

    await service.complete('user-1', 'task-1', {
      reason: 'SOIL_VERY_DRY',
      note: ' Dry deeper down. ',
    });

    expect(tx.taskFeedback.create).toHaveBeenCalledWith({
      data: {
        taskId: 'task-1',
        userId: 'user-1',
        action: 'COMPLETE',
        reason: 'SOIL_VERY_DRY',
        note: 'Dry deeper down.',
      },
    });
    expect(tx.task.update).toHaveBeenCalled();
    expect(tx.taskFeedback.create).toHaveBeenCalledTimes(1);
  });

  it('bulk completes authorized pending tasks without requiring feedback', async () => {
    const tasks = [
      { ...taskWithPlant, id: 'task-1' },
      { ...taskWithPlant, id: 'task-2', plantId: 'plant-2' },
    ];
    const prisma = {
      task: {
        findMany: jest.fn().mockResolvedValue(tasks),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const scheduler = { onTaskCompleted: jest.fn().mockResolvedValue(undefined) };
    const eventEmitter = { emit: jest.fn() };
    const service = new TasksService(
      prisma as never,
      scheduler as never,
      {} as never,
      eventEmitter as never,
    );

    const result = await service.bulkComplete('user-1', ['task-1', 'task-2']);

    expect(result.completed).toBe(2);
    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['task-1', 'task-2'] }, status: TaskStatus.PENDING },
      data: { status: TaskStatus.DONE, completedAt: expect.any(Date) },
    });
    expect(scheduler.onTaskCompleted).toHaveBeenCalledTimes(2);
    expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
  });

  it('schedules only one next reminder for duplicate historical tasks in the same care stop', async () => {
    const tasks = [
      { ...taskWithPlant, id: 'older', dueDate: new Date('2026-05-01') },
      { ...taskWithPlant, id: 'newer', dueDate: new Date('2026-06-01') },
    ];
    const prisma = {
      task: {
        findMany: jest.fn().mockResolvedValue(tasks),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const scheduler = { onTaskCompleted: jest.fn().mockResolvedValue(undefined) };
    const eventEmitter = { emit: jest.fn() };
    const service = new TasksService(
      prisma as never,
      scheduler as never,
      {} as never,
      eventEmitter as never,
    );

    await service.bulkComplete('user-1', ['older', 'newer']);

    expect(scheduler.onTaskCompleted).toHaveBeenCalledTimes(1);
    expect(scheduler.onTaskCompleted).toHaveBeenCalledWith('newer');
    expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
  });

  it('snoozes a pending task to today plus N days', async () => {
    const tx = {
      task: {
        update: jest.fn().mockResolvedValue({
          ...task,
          dueDate: new Date('2026-05-20'),
          plant: { species: { commonName: 'Monstera' } },
        }),
      },
      taskFeedback: {
        create: jest.fn().mockResolvedValue({ id: 'feedback-snooze' }),
      },
    };
    const prisma = {
      task: { findFirst: jest.fn().mockResolvedValue(taskWithPlant) },
      $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    };
    const scheduler = { onTaskCompleted: jest.fn() };
    const service = new TasksService(prisma as never, scheduler as never, {} as never, {
      emit: jest.fn(),
    } as never);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-17T15:00:00.000Z'));

    try {
      const result = await service.snooze('user-1', 'task-1', { days: 3 });

      expect(result.dueDate).toEqual(new Date('2026-05-20'));
      expect(tx.taskFeedback.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SNOOZE',
          reason: 'SNOOZE_3D',
        }),
      });
      expect(scheduler.onTaskCompleted).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('allows a shared garden caretaker to snooze a pending task', async () => {
    const sharedTask = {
      ...taskWithPlant,
      plant: {
        userId: 'owner-1',
        garden: { members: [{ userId: 'caregiver-1', role: 'CAREGIVER' }] },
        shares: [],
      },
    };
    const { service, tx } = createService(sharedTask);

    await service.snooze('caregiver-1', 'task-1', { days: 1 });

    expect(tx.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: { dueDate: expect.any(Date) },
      }),
    );
  });

  it('rejects skipping a task owned by another user', async () => {
    const { service } = createService(null);

    await expect(service.skip('user-1', 'task-1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects snoozing a task that is not pending', async () => {
    const { service } = createService({ ...taskWithPlant, status: TaskStatus.DONE });

    await expect(service.snooze('user-1', 'task-1', { days: 3 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects snoozing a task owned by another user', async () => {
    const { service } = createService(null);

    await expect(service.snooze('user-1', 'task-1', { days: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
