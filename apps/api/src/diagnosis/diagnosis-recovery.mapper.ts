import { TaskType } from '@prisma/client';
import { createHash } from 'crypto';

export type RecoveryTaskSuggestion = {
  key: string;
  label: string;
  taskType: TaskType;
  dueInDays: number;
  priority?: 'high' | 'medium' | 'low';
  section?: 'stabilize' | 'treat' | 'prevent' | 'follow_up';
  source?: 'treatment_plan' | 'diagnosis_action' | 'advice_text';
};

type StructuredDetail = {
  immediateActions?: string[];
  treatmentPlan?: {
    steps?: Array<{
      label?: string;
      taskType?: TaskType;
      dueInDays?: number;
      priority?: 'high' | 'medium' | 'low';
      section?: 'stabilize' | 'treat' | 'prevent' | 'follow_up';
    }>;
  };
};

const RULES: { pattern: RegExp; taskType: TaskType; dueInDays: number }[] = [
  { pattern: /\b(repot|transplant|fresh soil|new pot)\b/i, taskType: TaskType.REPOT, dueInDays: 3 },
  { pattern: /\b(water|soak|irrigate|hydrat)\b/i, taskType: TaskType.WATER, dueInDays: 0 },
  { pattern: /\b(fertiliz|feed|nutrient)\b/i, taskType: TaskType.FERTILIZE, dueInDays: 2 },
  {
    pattern: /\b(pest|neem|insecticid|miticide|spray for bug)\b/i,
    taskType: TaskType.PEST_CONTROL,
    dueInDays: 1,
  },
  { pattern: /\b(prune|trim|deadhead|pinch|cut back)\b/i, taskType: TaskType.PRUNE, dueInDays: 2 },
  { pattern: /\b(mist|humid)\b/i, taskType: TaskType.MIST, dueInDays: 1 },
  { pattern: /\b(rotate|turn the pot)\b/i, taskType: TaskType.ROTATE, dueInDays: 0 },
  {
    pattern: /\b(clean|wipe|dust).*(leaf|leaves)\b/i,
    taskType: TaskType.CLEAN_LEAVES,
    dueInDays: 1,
  },
  {
    pattern: /\b(inspect|check).*(pest|bug|mite)\b/i,
    taskType: TaskType.INSPECT_PESTS,
    dueInDays: 1,
  },
  {
    pattern: /\b(soil moisture|moisture check|finger test|dry soil)\b/i,
    taskType: TaskType.CHECK_MOISTURE,
    dueInDays: 0,
  },
  { pattern: /\b(ph test|soil ph|acidity)\b/i, taskType: TaskType.PH_TEST, dueInDays: 3 },
  {
    pattern: /\b(monitor|recheck|follow.?up|health check|watch for)\b/i,
    taskType: TaskType.HEALTH_CHECK,
    dueInDays: 3,
  },
];

function suggestionKey(diagnosisId: string, label: string, taskType: TaskType): string {
  const hash = createHash('sha256')
    .update(`${diagnosisId}:${label}:${taskType}`)
    .digest('hex')
    .slice(0, 12);
  return `${diagnosisId}:${hash}`;
}

export function mapActionToSuggestion(
  diagnosisId: string,
  action: string,
): RecoveryTaskSuggestion {
  const label = action.trim();
  const lower = label.toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(lower)) {
      return {
        key: suggestionKey(diagnosisId, label, rule.taskType),
        label,
        taskType: rule.taskType,
        dueInDays: rule.dueInDays,
        source: 'diagnosis_action',
      };
    }
  }
  return {
    key: suggestionKey(diagnosisId, label, TaskType.HEALTH_CHECK),
    label,
    taskType: TaskType.HEALTH_CHECK,
    dueInDays: 1,
    source: 'diagnosis_action',
  };
}

function treatmentPlanSuggestions(
  diagnosisId: string,
  detail: StructuredDetail | null,
): RecoveryTaskSuggestion[] {
  const steps = detail?.treatmentPlan?.steps;
  if (!Array.isArray(steps)) return [];

  return steps
    .filter((step) => step?.label && step.taskType)
    .map((step) => {
      const label = String(step.label).trim();
      const taskType = step.taskType as TaskType;
      return {
        key: suggestionKey(diagnosisId, label, taskType),
        label,
        taskType,
        dueInDays: Math.max(0, Number(step.dueInDays) || 0),
        priority: step.priority,
        section: step.section,
        source: 'treatment_plan' as const,
      };
    });
}

function parseDetailJson(detailJson?: string | null): StructuredDetail | null {
  if (!detailJson) return null;
  try {
    return JSON.parse(detailJson) as StructuredDetail;
  } catch {
    return null;
  }
}

function actionsFromAdviceText(adviceText?: string | null): string[] {
  if (!adviceText) return [];
  const lines = adviceText
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, '').trim())
    .filter((l) => l.length > 8);
  return lines.slice(0, 6);
}

export function buildRecoverySuggestions(
  diagnosisId: string,
  detailJson?: string | null,
  adviceText?: string | null,
): RecoveryTaskSuggestion[] {
  const detail = parseDetailJson(detailJson);
  const treatmentSuggestions = treatmentPlanSuggestions(diagnosisId, detail);
  if (treatmentSuggestions.length > 0) {
    return dedupeSuggestions(treatmentSuggestions);
  }

  let actions = detail?.immediateActions?.filter((a) => a?.trim()) ?? [];
  if (actions.length === 0) {
    actions = actionsFromAdviceText(adviceText);
  }
  if (actions.length === 0) {
    return [
      mapActionToSuggestion(diagnosisId, 'Recheck plant health and symptoms'),
    ];
  }

  const seen = new Set<string>();
  const suggestions: RecoveryTaskSuggestion[] = [];
  for (const action of actions) {
    const mapped = {
      ...mapActionToSuggestion(diagnosisId, action),
      source: detail?.immediateActions?.length ? ('diagnosis_action' as const) : ('advice_text' as const),
    };
    const dedupe = `${mapped.taskType}:${mapped.label.toLowerCase()}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    suggestions.push(mapped);
  }
  return suggestions;
}

function dedupeSuggestions(suggestions: RecoveryTaskSuggestion[]): RecoveryTaskSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const dedupe = `${suggestion.taskType}:${suggestion.label.toLowerCase()}`;
    if (seen.has(dedupe)) return false;
    seen.add(dedupe);
    return true;
  });
}
