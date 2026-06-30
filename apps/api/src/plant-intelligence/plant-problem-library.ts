import { TaskType } from '@prisma/client';

export type PlantProblemCategory =
  | 'water'
  | 'roots'
  | 'light'
  | 'pests'
  | 'disease'
  | 'nutrition'
  | 'environment';

export interface TreatmentStepTemplate {
  label: string;
  taskType: TaskType;
  dueInDays: number;
  priority: 'high' | 'medium' | 'low';
  section: 'stabilize' | 'treat' | 'prevent' | 'follow_up';
}

export interface PlantProblemDefinition {
  id: string;
  label: string;
  category: PlantProblemCategory;
  symptomMatchers: RegExp[];
  overview: string;
  likelyCauses: string[];
  immediateActions: string[];
  longTermCare: string[];
  mistakesToAvoid: string[];
  escalation: string;
  expectedTimeline: string;
  treatmentSteps: TreatmentStepTemplate[];
}

export interface ProblemMatchInput {
  issueName?: string | null;
  symptomsText?: string | null;
  imageLabel?: string | null;
  adviceText?: string | null;
  immediateActions?: string[];
  longTermCare?: string[];
}

export interface ProblemMatch {
  problem: PlantProblemDefinition;
  score: number;
  reasons: string[];
}

export const PLANT_PROBLEM_LIBRARY: PlantProblemDefinition[] = [
  {
    id: 'overwatering-root-risk',
    label: 'Overwatering or root rot risk',
    category: 'roots',
    symptomMatchers: [/overwater/i, /root rot/i, /mushy/i, /soggy/i, /wet soil/i, /yellow.*lower/i],
    overview: 'The plant may be staying wet too long, which can starve roots of oxygen and invite rot.',
    likelyCauses: ['Watering before the soil dries enough', 'Poor drainage', 'Dense or compacted potting mix'],
    immediateActions: [
      'Check soil moisture and pause watering if the mix is still wet.',
      'Inspect drainage holes and empty any standing water from the saucer.',
      'If stems are soft or the soil smells sour, inspect roots and repot into fresh mix.',
    ],
    longTermCare: [
      'Water only when the plant reaches its preferred dry-down point.',
      'Use a pot and mix that drain quickly enough for the species.',
    ],
    mistakesToAvoid: [
      'Do not fertilize a plant with stressed or rotting roots.',
      'Do not add more water to fix yellowing until soil moisture is checked.',
    ],
    escalation: 'If the base is collapsing, roots are black and mushy, or rot keeps spreading, propagate healthy cuttings or ask a nursery for help.',
    expectedTimeline: 'Stabilization usually takes 1-2 weeks; new healthy growth may take several weeks.',
    treatmentSteps: [
      { label: 'Check soil moisture before watering again', taskType: TaskType.CHECK_MOISTURE, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Inspect drainage and remove standing saucer water', taskType: TaskType.HEALTH_CHECK, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Repot into fresh, better-draining mix if roots are soft or sour-smelling', taskType: TaskType.REPOT, dueInDays: 2, priority: 'medium', section: 'treat' },
      { label: 'Recheck leaves and soil moisture after recovery changes', taskType: TaskType.HEALTH_CHECK, dueInDays: 7, priority: 'medium', section: 'follow_up' },
    ],
  },
  {
    id: 'underwatering-dry-stress',
    label: 'Underwatering or dry stress',
    category: 'water',
    symptomMatchers: [/underwater/i, /crispy/i, /dry soil/i, /wilting/i, /droop/i, /shrivel/i, /brown tip/i],
    overview: 'The plant may be drying past its comfort point or not absorbing water evenly.',
    likelyCauses: ['Soil drying too completely', 'Water running around a dry root ball', 'Low humidity for sensitive plants'],
    immediateActions: [
      'Check soil moisture near the root zone.',
      'Water thoroughly if the mix is dry, then let excess water drain.',
      'Trim only fully dead tips or leaves after the plant is rehydrated.',
    ],
    longTermCare: [
      'Set a reminder based on soil checks, not just a fixed calendar.',
      'Watch for repeated fast drying that may mean the plant is root-bound.',
    ],
    mistakesToAvoid: [
      'Do not keep soil constantly wet after a dry-stress episode.',
      'Do not prune heavily while the plant is limp.',
    ],
    escalation: 'If the plant stays wilted after a full watering and drainage check, inspect roots and stems for rot or pests.',
    expectedTimeline: 'Leaves may perk up within 24 hours, while damaged tips remain until new growth replaces them.',
    treatmentSteps: [
      { label: 'Check root-zone soil moisture', taskType: TaskType.CHECK_MOISTURE, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Water thoroughly if soil is dry and let the pot drain', taskType: TaskType.WATER, dueInDays: 0, priority: 'high', section: 'treat' },
      { label: 'Recheck hydration and leaf posture', taskType: TaskType.HEALTH_CHECK, dueInDays: 2, priority: 'medium', section: 'follow_up' },
    ],
  },
  {
    id: 'pest-pressure',
    label: 'Pest pressure',
    category: 'pests',
    symptomMatchers: [/pest/i, /mite/i, /mealybug/i, /scale/i, /thrip/i, /aphid/i, /webbing/i, /sticky/i, /insect/i],
    overview: 'Small sap-sucking pests can cause spotting, stippling, sticky residue, curling, or weak new growth.',
    likelyCauses: ['New plant introduction', 'Dry indoor air', 'Pests hiding on leaf undersides or stem joints'],
    immediateActions: [
      'Isolate the plant from nearby plants.',
      'Inspect leaf undersides, stems, and new growth closely.',
      'Wipe or rinse visible pests, then use a plant-safe treatment if needed.',
    ],
    longTermCare: [
      'Repeat inspections weekly until no pests are seen.',
      'Check neighboring plants so the problem does not cycle back.',
    ],
    mistakesToAvoid: [
      'Do not spray in direct sun or on a severely dehydrated plant.',
      'Do not use edible-plant treatments unless the product is labeled for edible crops.',
    ],
    escalation: 'If pests return after repeated treatment or the plant declines quickly, bring photos and a sample leaf to a local nursery.',
    expectedTimeline: 'Visible pest pressure should drop after the first treatment; full control often takes 2-4 weekly checks.',
    treatmentSteps: [
      { label: 'Inspect leaves, stems, and nearby plants for pests', taskType: TaskType.INSPECT_PESTS, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Apply a plant-safe pest treatment if pests are confirmed', taskType: TaskType.PEST_CONTROL, dueInDays: 1, priority: 'high', section: 'treat' },
      { label: 'Clean leaves to remove residue and improve inspection visibility', taskType: TaskType.CLEAN_LEAVES, dueInDays: 2, priority: 'medium', section: 'treat' },
      { label: 'Repeat pest inspection after treatment window', taskType: TaskType.INSPECT_PESTS, dueInDays: 7, priority: 'medium', section: 'follow_up' },
    ],
  },
  {
    id: 'fungal-leaf-spot',
    label: 'Leaf spot or fungal stress',
    category: 'disease',
    symptomMatchers: [/leaf spot/i, /spot/i, /blight/i, /mildew/i, /fung/i, /mold/i, /lesion/i],
    overview: 'Leaf spotting often worsens when foliage stays wet, airflow is low, or infected leaves remain on the plant.',
    likelyCauses: ['Wet foliage', 'Crowded growth', 'Old infected leaves or debris'],
    immediateActions: [
      'Remove badly affected leaves with clean tools.',
      'Avoid wetting leaves when watering.',
      'Improve airflow around the plant.',
    ],
    longTermCare: [
      'Keep foliage drier and clean up fallen leaves.',
      'Monitor new growth for fresh spots before using stronger treatments.',
    ],
    mistakesToAvoid: [
      'Do not compost diseased leaves from a severe outbreak.',
      'Do not spray fungicide without reading label safety and plant compatibility.',
    ],
    escalation: 'If spots spread rapidly, affect new growth, or appear on edible crops, consult a local extension office or nursery.',
    expectedTimeline: 'Existing spots will not disappear; success means fewer new spots over 1-3 weeks.',
    treatmentSteps: [
      { label: 'Prune heavily spotted or dying leaves with clean tools', taskType: TaskType.PRUNE, dueInDays: 0, priority: 'high', section: 'treat' },
      { label: 'Water at soil level and avoid wetting foliage', taskType: TaskType.WATER, dueInDays: 1, priority: 'medium', section: 'prevent' },
      { label: 'Recheck new growth for fresh spotting', taskType: TaskType.HEALTH_CHECK, dueInDays: 7, priority: 'medium', section: 'follow_up' },
    ],
  },
  {
    id: 'nutrient-light-yellowing',
    label: 'Yellow leaves from nutrition or light stress',
    category: 'nutrition',
    symptomMatchers: [/yellow/i, /chlorosis/i, /pale/i, /nutrient/i, /fertiliz/i, /feed/i],
    overview: 'Yellowing can come from water stress, low light, normal old-leaf aging, or nutrient imbalance.',
    likelyCauses: ['Watering mismatch', 'Light too low for the plant', 'Nutrient depletion during active growth'],
    immediateActions: [
      'Check soil moisture before changing the schedule.',
      'Review whether light changed recently.',
      'Remove fully yellow leaves once they are no longer useful to the plant.',
    ],
    longTermCare: [
      'Fertilize lightly only when the plant is stable and actively growing.',
      'Track whether yellowing continues on new leaves.',
    ],
    mistakesToAvoid: [
      'Do not fertilize dry soil or a plant with suspected root rot.',
      'Do not move abruptly from low light into harsh direct sun.',
    ],
    escalation: 'If many leaves yellow quickly or stems soften, treat as a possible root problem.',
    expectedTimeline: 'Yellow leaves usually do not turn green again; look for stable new growth over 2-4 weeks.',
    treatmentSteps: [
      { label: 'Check soil moisture and recent light changes', taskType: TaskType.CHECK_MOISTURE, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Rotate plant for more even light exposure', taskType: TaskType.ROTATE, dueInDays: 1, priority: 'low', section: 'prevent' },
      { label: 'Fertilize lightly only if roots are healthy and growth is active', taskType: TaskType.FERTILIZE, dueInDays: 7, priority: 'low', section: 'prevent' },
      { label: 'Recheck whether yellowing is continuing on new leaves', taskType: TaskType.HEALTH_CHECK, dueInDays: 10, priority: 'medium', section: 'follow_up' },
    ],
  },
  {
    id: 'environmental-shock',
    label: 'Environmental or transplant shock',
    category: 'environment',
    symptomMatchers: [/shock/i, /repot/i, /transplant/i, /draft/i, /cold/i, /heat/i, /moved/i, /dropping leaves/i],
    overview: 'Plants can drop, droop, or pause growth after a move, repot, temperature swing, or sudden light change.',
    likelyCauses: ['Recent relocation', 'Repotting stress', 'Drafts or temperature swings'],
    immediateActions: [
      'Keep care steady and avoid additional major changes.',
      'Check moisture and temperature before watering again.',
      'Remove only dead tissue while the plant settles.',
    ],
    longTermCare: [
      'Give the plant a stable spot with appropriate light.',
      'Wait for signs of new growth before fertilizing.',
    ],
    mistakesToAvoid: [
      'Do not repot again unless there is a clear root or drainage problem.',
      'Do not chase symptoms by changing water, light, and fertilizer all at once.',
    ],
    escalation: 'If wilting continues with wet soil or stems soften, reassess for root rot.',
    expectedTimeline: 'Mild shock often stabilizes in 1-3 weeks, with new growth later.',
    treatmentSteps: [
      { label: 'Check moisture and keep conditions stable', taskType: TaskType.CHECK_MOISTURE, dueInDays: 0, priority: 'high', section: 'stabilize' },
      { label: 'Rotate only if the plant is leaning or light is uneven', taskType: TaskType.ROTATE, dueInDays: 3, priority: 'low', section: 'prevent' },
      { label: 'Recheck for stable posture and no new leaf drop', taskType: TaskType.HEALTH_CHECK, dueInDays: 7, priority: 'medium', section: 'follow_up' },
    ],
  },
];

function searchable(input: ProblemMatchInput): string {
  return [
    input.issueName,
    input.symptomsText,
    input.imageLabel,
    input.adviceText,
    ...(input.immediateActions ?? []),
    ...(input.longTermCare ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchPlantProblems(input: ProblemMatchInput): ProblemMatch[] {
  const text = searchable(input);
  if (!text.trim()) {
    return [];
  }

  return PLANT_PROBLEM_LIBRARY.map((problem) => {
    const reasons: string[] = [];
    let score = 0;
    for (const matcher of problem.symptomMatchers) {
      if (matcher.test(text)) {
        score += 2;
        reasons.push(`Matched ${problem.label.toLowerCase()} symptom language`);
      }
    }
    if (
      problem.id === 'overwatering-root-risk' &&
      /(wet|soggy|mushy|root rot|standing water|sour-smelling)/.test(text) &&
      /(yellow|droop|wilt|soft|collapse)/.test(text)
    ) {
      score += 3;
      reasons.push('Matched wet-soil decline pattern');
    }
    if (input.issueName && problem.symptomMatchers.some((matcher) => matcher.test(input.issueName ?? ''))) {
      score += 3;
      reasons.push('Matched diagnosis label');
    }
    return { problem, score, reasons };
  })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
