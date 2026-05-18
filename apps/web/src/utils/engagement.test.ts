import { describe, expect, it } from 'vitest';
import {
  buildEngagementContext,
  deriveMilestones,
  formatSharePlantText,
  getCareStreak,
  getGardenWellness,
  getMilestoneHighlights,
  getOldestPlantAgeDays,
} from './engagement';
import type { TaskItem } from './taskGroups';

const currentDate = new Date('2026-05-17T12:00:00.000Z');

describe('engagement utilities', () => {
  it('counts a care streak across consecutive completion days', () => {
    const tasks = [
      doneTask('a', '2026-05-17'),
      doneTask('b', '2026-05-16'),
      doneTask('c', '2026-05-15'),
      doneTask('d', '2026-05-13'),
    ];

    expect(getCareStreak(tasks, currentDate)).toBe(3);
  });

  it('does not punish an incomplete today when yesterday had care', () => {
    const tasks = [doneTask('a', '2026-05-16')];
    expect(getCareStreak(tasks, currentDate)).toBe(1);
  });

  it('unlocks milestones from garden context without blocking care flows', () => {
    const ctx = buildEngagementContext(
      3,
      ['2026-04-01T00:00:00.000Z'],
      [doneTask('a', '2026-05-17'), doneTask('b', '2026-05-16')],
      currentDate,
    );

    const milestones = deriveMilestones(ctx);
    expect(milestones.find((item) => item.id === 'first_plant')?.unlocked).toBe(true);
    expect(milestones.find((item) => item.id === 'growing_garden')?.unlocked).toBe(true);
    expect(milestones.find((item) => item.id === 'care_rhythm_3')?.unlocked).toBe(false);

    const highlights = getMilestoneHighlights(milestones);
    expect(highlights.some((item) => item.unlocked)).toBe(true);
    expect(highlights.some((item) => !item.unlocked)).toBe(true);
  });

  it('returns encouraging wellness copy instead of punitive messaging', () => {
    const calm = getGardenWellness(4, 0, 0, 5, 4);
    expect(calm.headline).toMatch(/rhythm|momentum|calm/i);

    const overdue = getGardenWellness(4, 2, 0, 1, 0);
    expect(overdue.headline).toMatch(/catch-up/i);
    expect(overdue.detail).not.toMatch(/fail|bad|punish/i);
  });

  it('formats share text for a plant snapshot', () => {
    const text = formatSharePlantText({
      plantName: 'Kitchen Basil',
      speciesName: 'Basil',
      scientificName: 'Ocimum basilicum',
      location: 'Kitchen windowsill',
      sunlight: 'Bright indirect light',
      nextCareLabel: 'Water · May 20',
    });

    expect(text).toContain('Kitchen Basil');
    expect(text).toContain('Plant Care');
  });

  it('measures oldest plant age in days', () => {
    expect(getOldestPlantAgeDays(['2026-04-17T12:00:00.000Z'], currentDate)).toBeGreaterThanOrEqual(30);
  });
});

function doneTask(id: string, day: string): TaskItem {
  return {
    id,
    taskType: 'WATER',
    dueDate: day,
    status: 'DONE',
    completedAt: `${day}T12:00:00.000Z`,
    plant: {
      id: 'plant-1',
      nickname: 'Basil',
      species: { commonName: 'Basil' },
    },
  };
}
