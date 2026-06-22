import { describe, expect, it } from 'vitest';
import {
  dayLabel,
  groupDueTasksIntoCareRounds,
  groupTasksByDay,
  groupTasksByType,
  type TaskItem,
} from './taskGroups';

function atNoon(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

function makeTask(
  id: string,
  dueDate: string,
  status: string,
  taskType = 'WATER',
): TaskItem {
  return {
    id,
    taskType,
    dueDate,
    status,
    plant: { id: `p-${id}`, nickname: null, species: { commonName: 'Monstera' } },
  };
}

describe('dayLabel', () => {
  it('uses relative labels for today/tomorrow/yesterday', () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    expect(dayLabel(today)).toBe('Today');
    expect(dayLabel(tomorrow)).toBe('Tomorrow');
    expect(dayLabel(yesterday)).toBe('Yesterday');
  });

  it('formats other dates as weekday + month/day', () => {
    expect(dayLabel(new Date(2020, 6, 4))).toBe('Saturday, Jul 4');
  });
});

describe('groupTasksByDay', () => {
  it('groups by day, splits by status, and orders future first then past', () => {
    const groups = groupTasksByDay([
      makeTask('a', atNoon(-1), 'DONE'),
      makeTask('b', atNoon(0), 'PENDING'),
      makeTask('c', atNoon(0), 'SKIPPED'),
      makeTask('d', atNoon(1), 'PENDING'),
    ]);

    expect(groups.map((g) => g.label)).toEqual(['Today', 'Tomorrow', 'Yesterday']);

    const today = groups[0];
    expect(today.total).toBe(2);
    expect(today.pending.map((t) => t.id)).toEqual(['b']);
    expect(today.skipped.map((t) => t.id)).toEqual(['c']);
    expect(today.done).toHaveLength(0);
  });
});

describe('groupTasksByType', () => {
  it('orders known types by the care order, appends unknown types, and sorts by due date', () => {
    const groups = groupTasksByType([
      makeTask('w2', atNoon(1), 'PENDING', 'WATER'),
      makeTask('w1', atNoon(0), 'PENDING', 'WATER'),
      makeTask('f1', atNoon(0), 'PENDING', 'FERTILIZE'),
      makeTask('x1', atNoon(0), 'PENDING', 'CUSTOM_TYPE'),
    ]);

    expect(groups.map((g) => g.taskType)).toEqual(['WATER', 'FERTILIZE', 'CUSTOM_TYPE']);
    // WATER tasks sorted by due date ascending.
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['w1', 'w2']);
  });
});

describe('groupDueTasksIntoCareRounds', () => {
  it('groups by garden and care type while folding duplicate reminders into one plant stop', () => {
    const now = new Date('2026-06-22T12:00:00.000Z');
    const older = {
      ...makeTask('old-water', '2026-06-01T12:00:00.000Z', 'PENDING', 'WATER'),
      plant: {
        id: 'plant-1',
        nickname: 'Fern',
        garden: { id: 'garden-1', name: 'Patio' },
        species: { commonName: 'Boston Fern' },
      },
    };
    const today = {
      ...makeTask('today-water', '2026-06-22T12:00:00.000Z', 'PENDING', 'WATER'),
      plant: older.plant,
    };
    const future = {
      ...makeTask('future-feed', '2026-06-23T12:00:00.000Z', 'PENDING', 'FERTILIZE'),
      plant: older.plant,
    };

    const rounds = groupDueTasksIntoCareRounds([older, today, future], now);

    expect(rounds).toHaveLength(1);
    expect(rounds[0].gardenName).toBe('Patio');
    expect(rounds[0].careTypes[0].taskType).toBe('WATER');
    expect(rounds[0].careTypes[0].plants).toHaveLength(1);
    expect(rounds[0].careTypes[0].plants[0].tasks.map((task) => task.id)).toEqual([
      'old-water',
      'today-water',
    ]);
  });
});
