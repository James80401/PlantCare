import { TasksController } from './tasks.controller';

describe('TasksController', () => {
  it('passes optional skip feedback to the task service', () => {
    const tasksService = {
      skip: jest.fn(),
    };
    const controller = new TasksController(tasksService as never);
    const dto = { reason: 'SOIL_STILL_WET' as const, note: 'Still damp.' };

    controller.skip({ sub: 'user-1', email: 'test@example.com', planTier: 'PREMIUM' }, 'task-1', dto);

    expect(tasksService.skip).toHaveBeenCalledWith('user-1', 'task-1', dto);
  });

  it('passes bulk completion ids to the task service', () => {
    const tasksService = { bulkComplete: jest.fn() };
    const controller = new TasksController(tasksService as never);

    controller.bulkComplete(
      { sub: 'user-1', email: 'test@example.com', planTier: 'PREMIUM' },
      { taskIds: ['task-1', 'task-2'] },
    );

    expect(tasksService.bulkComplete).toHaveBeenCalledWith('user-1', ['task-1', 'task-2']);
  });

  it('passes snooze days to the task service', () => {
    const tasksService = { snooze: jest.fn() };
    const controller = new TasksController(tasksService as never);
    const dto = { days: 3 as const };

    controller.snooze({ sub: 'user-1', email: 'test@example.com', planTier: 'PREMIUM' }, 'task-1', dto);

    expect(tasksService.snooze).toHaveBeenCalledWith('user-1', 'task-1', dto);
  });
});
