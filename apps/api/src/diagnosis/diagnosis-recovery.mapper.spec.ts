import { TaskType } from '@prisma/client';
import { buildRecoverySuggestions, mapActionToSuggestion } from './diagnosis-recovery.mapper';

describe('diagnosis-recovery.mapper', () => {
  it('maps watering actions to WATER due today', () => {
    const s = mapActionToSuggestion('dx-1', 'Water thoroughly and empty the saucer');
    expect(s.taskType).toBe(TaskType.WATER);
    expect(s.dueInDays).toBe(0);
  });

  it('maps pest actions to PEST_CONTROL', () => {
    const s = mapActionToSuggestion('dx-1', 'Apply neem oil for spider mites');
    expect(s.taskType).toBe(TaskType.PEST_CONTROL);
  });

  it('builds suggestions from immediateActions in detailJson', () => {
    const suggestions = buildRecoverySuggestions(
      'dx-1',
      JSON.stringify({
        immediateActions: ['Repot into fresh mix', 'Check soil moisture tomorrow'],
      }),
    );
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].taskType).toBe(TaskType.REPOT);
    expect(suggestions[1].taskType).toBe(TaskType.CHECK_MOISTURE);
  });

  it('prefers structured treatment plan steps when available', () => {
    const suggestions = buildRecoverySuggestions(
      'dx-1',
      JSON.stringify({
        immediateActions: ['Water lightly'],
        treatmentPlan: {
          steps: [
            {
              label: 'Check soil moisture before watering again',
              taskType: TaskType.CHECK_MOISTURE,
              dueInDays: 0,
              priority: 'high',
              section: 'stabilize',
            },
            {
              label: 'Recheck plant health after care changes',
              taskType: TaskType.HEALTH_CHECK,
              dueInDays: 7,
              priority: 'medium',
              section: 'follow_up',
            },
          ],
        },
      }),
    );

    expect(suggestions).toHaveLength(2);
    expect(suggestions[0]).toEqual(
      expect.objectContaining({
        taskType: TaskType.CHECK_MOISTURE,
        priority: 'high',
        section: 'stabilize',
        source: 'treatment_plan',
      }),
    );
  });

  it('falls back to a health check when no actions exist', () => {
    const suggestions = buildRecoverySuggestions('dx-1', null, null);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].taskType).toBe(TaskType.HEALTH_CHECK);
  });
});
