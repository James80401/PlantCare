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
    expect(result.counts).toEqual({ journal: 1, care: 1, diagnosis: 1, total: 3 });
  });

  it('includes skip reason in care event description', () => {
    const result = buildPlantTimeline(
      [],
      [
        {
          id: 't2',
          plantId: 'p1',
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
});
