import { buildWeekPreview, pickTodayTasks } from './dashboard-helpers';

describe('dashboard-helpers', () => {
  it('builds week preview with counts', () => {
    const today = new Date('2026-06-01T12:00:00Z');
    const preview = buildWeekPreview(
      [
        {
          id: '1',
          taskType: 'WATER',
          dueDate: '2026-06-01',
          status: 'PENDING',
          plant: { id: 'p1', species: { commonName: 'Monstera' } },
        },
      ],
      today,
    );
    expect(preview).toHaveLength(7);
    expect(preview[0].count).toBe(1);
    expect(preview[0].label).toBe('Today');
  });

  it('picks overdue before today tasks', () => {
    const currentDate = new Date('2026-06-01T12:00:00');
    const tasks = pickTodayTasks(
      [
        {
          id: 'a',
          taskType: 'WATER',
          dueDate: '2026-05-28T12:00:00.000Z',
          status: 'PENDING',
          plant: { id: 'p1', species: { commonName: 'A' } },
        },
        {
          id: 'b',
          taskType: 'MIST',
          dueDate: '2026-06-01T12:00:00.000Z',
          status: 'PENDING',
          plant: { id: 'p2', species: { commonName: 'B' } },
        },
      ],
      5,
      currentDate,
    );
    expect(tasks.map((t) => t.id)).toEqual(['a', 'b']);
  });
});
