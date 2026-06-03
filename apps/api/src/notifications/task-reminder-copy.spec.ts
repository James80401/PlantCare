import { buildCareReminderPush } from './task-reminder-copy';

const plant = {
  nickname: 'Kitchen basil',
  species: { commonName: 'Basil' },
};

describe('buildCareReminderPush', () => {
  it('deep-links to plant for a single task', () => {
    const push = buildCareReminderPush([
      {
        taskType: 'WATER',
        plantId: 'plant-1',
        dueDate: new Date('2026-05-27'),
        plant,
      },
    ]);
    expect(push.route).toBe('/garden/plants/plant-1');
    expect(push.title).toContain('Water');
    expect(push.title).toContain('Kitchen basil');
  });

  it('summarizes multiple tasks and links to tasks page', () => {
    const push = buildCareReminderPush([
      {
        taskType: 'WATER',
        plantId: 'p1',
        dueDate: new Date(),
        plant,
      },
      {
        taskType: 'FERTILIZE',
        plantId: 'p2',
        dueDate: new Date(),
        plant: { nickname: null, species: { commonName: 'Snake Plant' } },
      },
    ]);
    expect(push.route).toBe('/garden/tasks');
    expect(push.title).toContain('2 care tasks');
    expect(push.body).toContain('Water');
    expect(push.body).toContain('Fertilize');
  });

  it('prefixes overdue reminders', () => {
    const push = buildCareReminderPush(
      [{ taskType: 'WATER', plantId: 'p1', dueDate: new Date('2026-05-20'), plant }],
      { overdue: true },
    );
    expect(push.title).toMatch(/^Overdue:/);
  });
});
