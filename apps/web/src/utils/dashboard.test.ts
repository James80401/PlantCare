import { describe, expect, it } from 'vitest';
import {
  buildAttentionPlants,
  buildWeekPreview,
  getGardenScore,
  getGardenScoreBreakdown,
  getOverdueTasks,
  getTasksCompletedToday,
  getSuggestedAction,
  getTodayTasks,
  type DashboardPlant,
} from './dashboard';
import type { TaskItem } from './taskGroups';

const currentDate = new Date('2026-05-17T12:00:00.000Z');

const plants: DashboardPlant[] = [
  plant('plant-overdue', 'Monstera', null),
  plant('plant-today', 'Basil', '/uploads/basil.jpg'),
  plant('plant-photo', 'Pothos', null),
  plant('plant-ok', 'Snake Plant', '/uploads/snake.jpg'),
];

describe('dashboard utilities', () => {
  it('calculates overdue and today tasks from a fixed current date', () => {
    const tasks = [
      task('late', 'plant-overdue', '2026-05-15', 'PENDING'),
      task('today', 'plant-today', '2026-05-17', 'PENDING'),
      task('future', 'plant-ok', '2026-05-20', 'PENDING'),
      task('done-late', 'plant-ok', '2026-05-14', 'DONE'),
    ];

    expect(getOverdueTasks(tasks, currentDate).map((item) => item.id)).toEqual(['late']);
    expect(getTodayTasks(tasks, currentDate).map((item) => item.id)).toEqual(['today']);
  });

  it('lists tasks completed on the given calendar day', () => {
    const currentDate = new Date('2026-05-18T12:00:00');
    const tasks = [
      task('done-today', 'plant-today', '2026-05-18', 'DONE', '2026-05-18T15:00:00'),
      task('done-yesterday', 'plant-today', '2026-05-17', 'DONE', '2026-05-17T15:00:00'),
    ];
    expect(getTasksCompletedToday(tasks, currentDate).map((t) => t.id)).toEqual(['done-today']);
  });

  it('explains garden score breakdown components', () => {
    const breakdown = getGardenScoreBreakdown(4, 2, 3, 5);
    expect(breakdown.overduePenalty).toBe(20);
    expect(breakdown.todayPenalty).toBe(6);
    expect(breakdown.completionBoost).toBe(8);
    expect(breakdown.finalScore).toBe(82);
  });

  it('keeps garden score encouraging but responsive to overdue and due-today work', () => {
    expect(getGardenScore(0, 0, 0)).toBe(0);
    expect(getGardenScore(4, 0, 0)).toBe(100);
    expect(getGardenScore(4, 2, 3)).toBe(74);
    expect(getGardenScore(4, 10, 10)).toBe(50);
    expect(getGardenScore(4, 0, 0, 3)).toBe(100);
  });

  it('prioritizes attention cards by urgency before profile completeness nudges', () => {
    const tasks = [
      task('late', 'plant-overdue', '2026-05-16', 'PENDING'),
      task('today', 'plant-today', '2026-05-17', 'PENDING'),
      task('future', 'plant-photo', '2026-05-22', 'PENDING'),
      task('ok', 'plant-ok', '2026-05-22', 'PENDING'),
    ];

    const attention = buildAttentionPlants(plants, tasks, currentDate);

    expect(attention.map((item) => [item.plant.id, item.tone, item.reason])).toEqual([
      ['plant-overdue', 'urgent', '1 overdue task'],
      ['plant-today', 'warning', '1 task due today'],
      ['plant-photo', 'info', 'Add a photo to make progress tracking more useful'],
    ]);
  });

  it('surfaces unresolved diagnoses before photo nudges', () => {
    const sickPlant: DashboardPlant = {
      ...plant('plant-sick', 'Fern', '/uploads/fern.jpg'),
      unresolvedDiagnosis: {
        resultLabel: 'Overwatering',
        createdAt: '2026-05-16T12:00:00.000Z',
      },
    };
    const tasks = [task('future', 'plant-sick', '2026-05-22', 'PENDING')];
    const attention = buildAttentionPlants([sickPlant], tasks, currentDate);
    expect(attention[0]?.reason).toContain('Unresolved diagnosis');
  });

  it('selects the suggested action for empty, overdue, active, and calm gardens', () => {
    const todayTasks = [task('today', 'plant-today', '2026-05-17', 'PENDING')];
    const overdueTasks = [task('late', 'plant-overdue', '2026-05-15', 'PENDING')];

    expect(getSuggestedAction([], [], []).title).toBe('Add your first plant');
    expect(getSuggestedAction(plants, overdueTasks, todayTasks).title).toBe('Catch up gently');
    expect(getSuggestedAction(plants, [], todayTasks).title).toBe('Finish today strong');
    expect(getSuggestedAction(plants, [], []).title).toBe('Log a quick observation');
  });

  it('builds a seven-day preview from pending tasks only', () => {
    const preview = buildWeekPreview(
      [
        task('today', 'plant-today', '2026-05-17', 'PENDING'),
        task('today-done', 'plant-today', '2026-05-17', 'DONE'),
        task('tomorrow', 'plant-ok', '2026-05-18', 'PENDING'),
        task('later', 'plant-ok', '2026-05-23', 'PENDING'),
        task('outside-window', 'plant-ok', '2026-05-25', 'PENDING'),
      ],
      currentDate,
    );

    expect(preview).toHaveLength(7);
    expect(preview.map((day) => [day.key, day.label, day.count])).toEqual([
      ['2026-05-17', 'Today', 1],
      ['2026-05-18', 'Mon', 1],
      ['2026-05-19', 'Tue', 0],
      ['2026-05-20', 'Wed', 0],
      ['2026-05-21', 'Thu', 0],
      ['2026-05-22', 'Fri', 0],
      ['2026-05-23', 'Sat', 1],
    ]);
  });
});

function plant(id: string, commonName: string, imageUrl: string | null): DashboardPlant {
  return {
    id,
    nickname: commonName,
    imageUrl,
    location: 'Living room',
    species: {
      commonName,
      wateringFreqDays: 7,
      sunlight: 'Bright indirect light',
    },
    tasks: [],
  };
}

function task(
  id: string,
  plantId: string,
  dueDate: string,
  status: 'PENDING' | 'DONE' | 'SKIPPED',
  completedAt?: string,
): TaskItem {
  const plantRecord = plants.find((item) => item.id === plantId);
  const commonName = plantRecord?.species.commonName ?? 'Plant';

  return {
    id,
    taskType: 'WATER',
    dueDate,
    status,
    completedAt:
      completedAt ?? (status === 'DONE' ? `${dueDate}T12:00:00.000Z` : null),
    plant: {
      id: plantId,
      nickname: commonName,
      species: { commonName },
    },
  };
}
