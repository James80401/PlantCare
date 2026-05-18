import { PotSize, TaskType } from '@prisma/client';
import { buildScheduleExplanation } from './schedule-explanation';

const baseSpecies = {
  commonName: 'Monstera',
  scientificName: 'Monstera deliciosa',
  wateringFreqDays: 7,
  careNotes: 'Tropical foliage',
};

const basePlant = {
  location: 'Living Room',
  potSize: PotSize.MEDIUM,
  datePlanted: null,
};

describe('buildScheduleExplanation', () => {
  it('explains watering with pot and species factors', () => {
    const result = buildScheduleExplanation({
      taskType: TaskType.WATER,
      dueDate: new Date('2026-06-01'),
      plant: basePlant,
      species: baseSpecies,
      waterIntervalDays: 7,
      isGrowingSeason: true,
    });

    expect(result.summary).toMatch(/Watering is due/);
    expect(result.factors.some((f) => f.label.includes('Species'))).toBe(true);
    expect(result.factors.some((f) => f.label.includes('pot'))).toBe(true);
  });

  it('includes skip feedback for water tasks', () => {
    const result = buildScheduleExplanation({
      taskType: TaskType.WATER,
      dueDate: new Date('2026-06-01'),
      plant: basePlant,
      species: baseSpecies,
      waterIntervalDays: 7,
      isGrowingSeason: true,
      recentWetSoilSkips: 2,
    });

    expect(result.factors.some((f) => f.label.includes('skip feedback'))).toBe(true);
  });

  it('explains repot with eligibility factor', () => {
    const result = buildScheduleExplanation({
      taskType: TaskType.REPOT,
      dueDate: new Date('2026-07-15'),
      plant: basePlant,
      species: baseSpecies,
      waterIntervalDays: 7,
      isGrowingSeason: true,
    });

    expect(result.summary).toMatch(/Repot/);
    expect(result.factors.some((f) => f.label.includes('eligibility'))).toBe(true);
  });

  it('uses shorter ph interval for herbs', () => {
    const result = buildScheduleExplanation({
      taskType: TaskType.PH_TEST,
      dueDate: new Date('2026-06-01'),
      plant: basePlant,
      species: { ...baseSpecies, commonName: 'Basil', scientificName: 'Ocimum basilicum' },
      waterIntervalDays: 5,
      isGrowingSeason: true,
    });

    expect(result.summary).toMatch(/90 days/);
  });
});
