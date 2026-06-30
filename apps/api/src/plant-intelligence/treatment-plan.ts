import { createHash } from 'crypto';
import { TaskType } from '@prisma/client';
import { resolveCareArchetype, type ArchetypeSpeciesInput, type CareArchetype } from './care-archetypes';
import { matchPlantProblems, type PlantProblemDefinition, type TreatmentStepTemplate } from './plant-problem-library';

export interface TreatmentPlanStep {
  key: string;
  label: string;
  taskType: TaskType;
  dueInDays: number;
  priority: 'high' | 'medium' | 'low';
  section: 'stabilize' | 'treat' | 'prevent' | 'follow_up';
  source: 'problem_library' | 'diagnosis_action' | 'archetype';
}

export interface TreatmentPlan {
  version: 1;
  headline: string;
  urgency: 'routine' | 'soon' | 'urgent';
  matchedProblems: Array<Pick<PlantProblemDefinition, 'id' | 'label' | 'category' | 'overview' | 'expectedTimeline'>>;
  careArchetype: CareArchetype;
  steps: TreatmentPlanStep[];
  mistakesToAvoid: string[];
  expectedTimeline: string;
  beginnerSafetyNotes: string[];
}

export interface TreatmentPlanInput {
  diagnosisId?: string;
  issueName?: string | null;
  symptomsText?: string | null;
  adviceText?: string | null;
  imageLabel?: string | null;
  confidence?: number | null;
  immediateActions?: string[];
  longTermCare?: string[];
  whenToSeekHelp?: string | null;
  species: ArchetypeSpeciesInput;
}

function stepKey(seed: string, step: Pick<TreatmentPlanStep, 'label' | 'taskType' | 'dueInDays'>): string {
  const hash = createHash('sha256')
    .update(`${seed}:${step.label}:${step.taskType}:${step.dueInDays}`)
    .digest('hex')
    .slice(0, 12);
  return `${seed}:${hash}`;
}

function inferTaskType(action: string): TaskType {
  const text = action.toLowerCase();
  if (/\b(repot|fresh mix|new pot|roots?)\b/.test(text)) return TaskType.REPOT;
  if (/\b(water|soak|hydrate|drain)\b/.test(text)) return TaskType.WATER;
  if (/\b(fertiliz|feed|nutrient)\b/.test(text)) return TaskType.FERTILIZE;
  if (/\b(pest|mite|mealybug|scale|thrip|aphid|neem|soap|spray)\b/.test(text)) return TaskType.PEST_CONTROL;
  if (/\b(inspect|check).*(pest|mite|bug|leaf underside)\b/.test(text)) return TaskType.INSPECT_PESTS;
  if (/\b(prune|trim|remove.*leaf|cut)\b/.test(text)) return TaskType.PRUNE;
  if (/\b(mist|humidity|humid)\b/.test(text)) return TaskType.MIST;
  if (/\b(clean|wipe|dust)\b/.test(text)) return TaskType.CLEAN_LEAVES;
  if (/\b(rotate|turn)\b/.test(text)) return TaskType.ROTATE;
  if (/\b(moisture|dry soil|finger test)\b/.test(text)) return TaskType.CHECK_MOISTURE;
  if (/\b(ph|acidity)\b/.test(text)) return TaskType.PH_TEST;
  return TaskType.HEALTH_CHECK;
}

function templateToStep(seed: string, template: TreatmentStepTemplate): TreatmentPlanStep {
  const step = {
    label: template.label,
    taskType: template.taskType,
    dueInDays: template.dueInDays,
    priority: template.priority,
    section: template.section,
    source: 'problem_library' as const,
  };
  return { ...step, key: stepKey(seed, step) };
}

function actionToStep(seed: string, action: string, index: number): TreatmentPlanStep {
  const taskType = inferTaskType(action);
  const dueInDays = index === 0 ? 0 : Math.min(5, index + 1);
  const step = {
    label: action.trim(),
    taskType,
    dueInDays,
    priority: index <= 1 ? ('high' as const) : ('medium' as const),
    section: index <= 1 ? ('stabilize' as const) : ('treat' as const),
    source: 'diagnosis_action' as const,
  };
  return { ...step, key: stepKey(seed, step) };
}

function dedupeSteps(steps: TreatmentPlanStep[]): TreatmentPlanStep[] {
  const seen = new Set<string>();
  const priorityRank = { high: 0, medium: 1, low: 2 };
  return steps
    .sort((a, b) => a.dueInDays - b.dueInDays || priorityRank[a.priority] - priorityRank[b.priority])
    .filter((step) => {
      const key = `${step.taskType}:${step.label.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function inferUrgency(input: TreatmentPlanInput, problems: PlantProblemDefinition[]): TreatmentPlan['urgency'] {
  const text = [
    input.issueName,
    input.symptomsText,
    input.adviceText,
    input.whenToSeekHelp,
    ...problems.map((p) => p.id),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/rot|mushy|collapse|rapid|severe|blight|pest-pressure/.test(text)) return 'urgent';
  if (/yellow|droop|spot|wilt|pest|underwater|overwater/.test(text)) return 'soon';
  return 'routine';
}

export function buildTreatmentPlan(input: TreatmentPlanInput): TreatmentPlan {
  const seed = input.diagnosisId ?? 'pending-diagnosis';
  const careArchetype = resolveCareArchetype(input.species);
  const problemMatches = matchPlantProblems(input);
  const problems = problemMatches.map((match) => match.problem);

  const problemSteps = problems.flatMap((problem) =>
    problem.treatmentSteps.map((template) => templateToStep(seed, template)),
  );
  const diagnosisSteps = (input.immediateActions ?? [])
    .filter((action) => action?.trim())
    .map((action, index) => actionToStep(seed, action, index));

  const archetypeStep: TreatmentPlanStep = {
    key: stepKey(seed, {
      label: 'Recheck plant health after care changes',
      taskType: TaskType.HEALTH_CHECK,
      dueInDays: input.confidence != null && input.confidence < 0.55 ? 3 : 7,
    }),
    label: 'Recheck plant health after care changes',
    taskType: TaskType.HEALTH_CHECK,
    dueInDays: input.confidence != null && input.confidence < 0.55 ? 3 : 7,
    priority: input.confidence != null && input.confidence < 0.55 ? 'high' : 'medium',
    section: 'follow_up',
    source: 'archetype',
  };

  const steps = dedupeSteps([...problemSteps, ...diagnosisSteps, archetypeStep]);
  const matchedProblems = problems.map(({ id, label, category, overview, expectedTimeline }) => ({
    id,
    label,
    category,
    overview,
    expectedTimeline,
  }));

  return {
    version: 1,
    headline: problems[0]?.label ?? input.issueName ?? 'Plant recovery plan',
    urgency: inferUrgency(input, problems),
    matchedProblems,
    careArchetype,
    steps,
    mistakesToAvoid: [
      ...new Set([
        ...problems.flatMap((problem) => problem.mistakesToAvoid),
        ...careArchetype.treatmentModifiers,
      ]),
    ].slice(0, 6),
    expectedTimeline:
      problems[0]?.expectedTimeline ??
      'Most care changes should be reassessed after 1-2 weeks, judging by new growth and whether symptoms stop spreading.',
    beginnerSafetyNotes: [
      ...careArchetype.beginnerNotes,
      'Plant diagnosis is probabilistic. If decline is rapid, toxic exposure is possible, or a treatment label is unclear, ask a local nursery or extension office.',
    ],
  };
}

