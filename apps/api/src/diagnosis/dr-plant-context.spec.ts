import { buildDrPlantContextSummary, type DrPlantContextSignals } from './dr-plant-context';

describe('buildDrPlantContextSummary', () => {
  const base: DrPlantContextSignals = {
    location: 'Living room',
    potSize: 'MEDIUM',
    wateringFreqDays: 7,
    sunlight: 'Bright indirect',
    journal: [],
    pendingTasks: [],
    feedback: [],
    activeDiagnosis: null,
    weatherAlert: null,
  };

  it('always includes a care baseline chip', () => {
    const summary = buildDrPlantContextSummary(base);
    const care = summary.items.find((i) => i.category === 'care');
    expect(care?.label).toBe('Care baseline');
    expect(care?.detail).toContain('Living room');
    expect(care?.detail).toContain('medium pot');
    expect(care?.detail).toContain('water ~every 7 days');
  });

  it('summarizes upcoming tasks, journal, and an open diagnosis', () => {
    const summary = buildDrPlantContextSummary({
      ...base,
      pendingTasks: [
        { taskType: 'WATER', dueDate: new Date('2026-06-06') },
        { taskType: 'FERTILIZE', dueDate: new Date('2026-06-10') },
      ],
      journal: [{ notes: 'New leaf', createdAt: new Date('2026-06-01') }],
      activeDiagnosis: { resultLabel: 'Overwatering', createdAt: new Date('2026-06-02') },
    });

    const labels = summary.items.map((i) => i.label);
    expect(labels).toContain('2 upcoming care tasks');
    expect(labels).toContain('1 recent journal note');
    expect(summary.items.find((i) => i.category === 'tasks')?.detail).toContain('next:');
    expect(summary.items.find((i) => i.category === 'health')?.label).toBe(
      'Open issue: Overwatering',
    );
  });

  it('separates skip and completion feedback', () => {
    const summary = buildDrPlantContextSummary({
      ...base,
      feedback: [
        { action: 'SKIP', reason: 'SOIL_STILL_WET', note: 'damp 2 inches down', taskType: 'WATER' },
        { action: 'COMPLETE', reason: 'SOIL_VERY_DRY', note: null, taskType: 'WATER' },
        { action: 'SNOOZE', reason: 'SNOOZE_3D', note: 'Snoozed' },
      ],
    });

    const feedbackItems = summary.items.filter((i) => i.category === 'feedback');
    expect(feedbackItems.map((i) => i.label)).toEqual([
      '1 recent skip',
      '1 recent care observation',
    ]);
    // Snooze rows are not surfaced as feedback chips.
    expect(feedbackItems).toHaveLength(2);
    expect(feedbackItems[0].detail).toContain('water: damp 2 inches down');
    expect(feedbackItems[1].detail).toContain('Water: soil very dry');
  });

  it('omits optional chips when no signals are present', () => {
    const summary = buildDrPlantContextSummary(base);
    const categories = summary.items.map((i) => i.category);
    expect(categories).toEqual(['care']);
    expect(summary.intro).toMatch(/Dr\. Plant/);
  });
});
