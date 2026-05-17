import { NotFoundException } from '@nestjs/common';
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

  function createService(taskResult: unknown = task) {
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

    const service = new TasksService(prisma as never, scheduler as never, {} as never);

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

  it('rejects skipping a task owned by another user', async () => {
    const { service } = createService(null);

    await expect(service.skip('user-1', 'task-1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
