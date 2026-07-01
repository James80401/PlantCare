import { TaskStatus, TaskType } from '@prisma/client';
import { buildPlantTimeline } from './plant-timeline.builder';

describe('buildPlantTimeline', () => {
  const baseDate = new Date('2026-03-01T12:00:00.000Z');

  it('merges journal, care, and diagnosis events newest first', () => {
    const result = buildPlantTimeline(
      [
        {
          id: 'j1',
          plantId: 'p1',
          notes: 'Growing well',
          photoUrl: null,
          heightCm: 30,
          widthCm: null,
          leafCount: null,
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date('2026-02-01'),
        },
      ],
      [
        {
          id: 't1',
          plantId: 'p1',
          gardenId: 'g1',
          taskType: TaskType.WATER,
          status: TaskStatus.DONE,
          dueDate: new Date('2026-02-28'),
          completedAt: baseDate,
          createdAt: baseDate,
          notifiedAt: null,
          sourceDiagnosisId: null,
          feedback: [],
        },
      ],
      [
        {
          id: 'd1',
          plantId: 'p1',
          resultLabel: 'Overwatering',
          adviceText: 'Let soil dry',
          confidence: 0.82,
          imageUrl: null,
          symptomsText: null,
          source: 'rules',
          resolved: false,
          createdAt: new Date('2026-01-15'),
          detailJson: null,
        },
      ],
    );

    expect(result.events[0].type).toBe('care');
    expect(result.events[0].title).toContain('Water');
    expect(result.events.find((e) => e.type === 'journal')?.meta).toContain('30 cm');
    expect(result.counts).toEqual({ journal: 1, care: 1, diagnosis: 1, progress: 0, total: 3 });
  });

  it('adds plant progress check-ins to the timeline', () => {
    const result = buildPlantTimeline(
      [],
      [],
      [],
      [
        {
          id: 'pce1',
          plantId: 'p1',
          userId: 'user-1',
          taskId: 'task-1',
          photoUrl: '/uploads/progress.jpg',
          overallHealth: 'CONCERNED',
          growthChange: 'LEAF_LOSS',
          leafCondition: 'YELLOWING',
          soilMoisture: 'WET',
          pestSigns: 'NONE',
          recentCare: 'WATERED',
          notes: 'Lower leaves yellowed this week.',
          analysisSummary: 'This plant needs watching after new yellowing and wet soil.',
          adviceText: 'Let the mix dry before watering again.',
          storyJson: null,
          createdAt: baseDate,
          updatedAt: baseDate,
        },
      ],
    );

    expect(result.events[0]).toMatchObject({
      type: 'progress',
      title: 'Progress check-in: needs watching',
      description: 'This plant needs watching after new yellowing and wet soil.',
      imageUrl: '/uploads/progress.jpg',
    });
    expect(result.events[0].meta).toContain('Leaf loss');
    expect(result.events[0].meta).toContain('Wet soil');
    expect(result.counts).toEqual({ journal: 0, care: 0, diagnosis: 0, progress: 1, total: 1 });
  });

  it('includes skip reason in care event description', () => {
    const result = buildPlantTimeline(
      [],
      [
        {
          id: 't2',
          plantId: 'p1',
          gardenId: 'g1',
          taskType: TaskType.FERTILIZE,
          status: TaskStatus.SKIPPED,
          dueDate: new Date('2026-03-01'),
          completedAt: baseDate,
          createdAt: baseDate,
          notifiedAt: null,
          sourceDiagnosisId: null,
          feedback: [
            {
              id: 'f1',
              taskId: 't2',
              userId: 'user-1',
              action: 'SKIP',
              reason: 'SOIL_STILL_WET',
              note: 'Top inch dry only',
              createdAt: baseDate,
            },
          ],
        },
      ],
      [],
    );

    expect(result.events[0].description).toContain('Soil still wet');
    expect(result.events[0].description).toContain('Top inch dry only');
  });

  it('surfaces the post-care observation (reason and note) on a completed task', () => {
    const result = buildPlantTimeline(
      [],
      [
        {
          id: 't-obs',
          plantId: 'p1',
          gardenId: 'g1',
          taskType: TaskType.WATER,
          status: TaskStatus.DONE,
          dueDate: new Date('2026-03-01'),
          completedAt: baseDate,
          createdAt: baseDate,
          notifiedAt: null,
          sourceDiagnosisId: null,
          feedback: [
            {
              id: 'fc1',
              taskId: 't-obs',
              userId: 'user-1',
              action: 'COMPLETE',
              reason: 'SOIL_VERY_DRY',
              note: 'Drooping leaves perked up after watering',
              createdAt: baseDate,
            },
          ],
        },
      ],
      [],
    );

    expect(result.events[0].title).toContain('completed');
    expect(result.events[0].description).toContain('soil was very dry');
    expect(result.events[0].description).toContain('Drooping leaves perked up after watering');
  });

  it('does not render a prior snooze as the complete/skip reason and notes reschedules', () => {
    const result = buildPlantTimeline(
      [],
      [
        {
          id: 't3',
          plantId: 'p1',
          gardenId: 'g1',
          taskType: TaskType.WATER,
          status: TaskStatus.DONE,
          dueDate: new Date('2026-03-05'),
          completedAt: baseDate,
          createdAt: baseDate,
          notifiedAt: null,
          sourceDiagnosisId: null,
          // Completed without explicit feedback, but snoozed twice beforehand.
          feedback: [
            {
              id: 'f2',
              taskId: 't3',
              userId: 'user-1',
              action: 'SNOOZE',
              reason: 'SNOOZE_3D',
              note: 'Snoozed until 2026-03-05',
              createdAt: new Date('2026-03-02'),
            },
            {
              id: 'f3',
              taskId: 't3',
              userId: 'user-1',
              action: 'SNOOZE',
              reason: 'SNOOZE_1D',
              note: 'Snoozed until 2026-03-02',
              createdAt: new Date('2026-03-01'),
            },
          ],
        },
      ],
      [],
    );

    const event = result.events[0];
    expect(event.title).toContain('completed');
    // The snooze copy must not leak into the description.
    expect(event.description).toBe('This care task was marked complete.');
    expect(event.description).not.toContain('Snoozed until');
    expect(event.meta).toContain('rescheduled 2×');
  });
});
