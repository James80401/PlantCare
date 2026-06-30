import { TaskType } from '@prisma/client';
import { buildTreatmentPlan } from './treatment-plan';

describe('buildTreatmentPlan', () => {
  const species = {
    commonName: 'Pothos',
    scientificName: 'Epipremnum aureum',
    wateringFreqDays: 7,
    sunlight: 'Bright indirect light',
    careNotes: 'Trailing tropical houseplant',
  };

  it('matches beginner symptom language to a plant problem plan', () => {
    const plan = buildTreatmentPlan({
      issueName: 'Yellow leaves',
      symptomsText: 'Lower leaves are yellow and the soil is wet',
      confidence: 0.82,
      species,
    });

    expect(plan.version).toBe(1);
    expect(plan.matchedProblems[0].id).toBe('overwatering-root-risk');
    expect(plan.steps.some((step) => step.taskType === TaskType.CHECK_MOISTURE)).toBe(true);
    expect(plan.steps.some((step) => step.section === 'follow_up')).toBe(true);
  });

  it('adds species archetype notes for drought tolerant plants', () => {
    const plan = buildTreatmentPlan({
      issueName: 'Brown tips',
      symptomsText: 'crispy tips but soil is still damp',
      species: {
        commonName: 'Snake Plant',
        scientificName: 'Sansevieria trifasciata',
        wateringFreqDays: 14,
        careNotes: 'Succulent-like plant',
      },
    });

    expect(plan.careArchetype.id).toBe('drought_tolerant');
    expect(plan.mistakesToAvoid.join(' ')).toMatch(/drainage|roots|dry/i);
  });

  it('turns diagnosis actions into scheduled treatment steps', () => {
    const plan = buildTreatmentPlan({
      issueName: 'Spider mites',
      immediateActions: ['Inspect leaf undersides for mites', 'Apply insecticidal soap if pests are present'],
      species,
    });

    expect(plan.steps.some((step) => step.taskType === TaskType.INSPECT_PESTS)).toBe(true);
    expect(plan.steps.some((step) => step.taskType === TaskType.PEST_CONTROL)).toBe(true);
  });
});

