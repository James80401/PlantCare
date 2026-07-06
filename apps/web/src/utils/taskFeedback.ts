export const TASK_SKIP_REASONS = [
  {
    value: 'SOIL_STILL_WET',
    label: 'Soil still wet',
    helper: 'The plant does not need water or moisture yet.',
  },
  {
    value: 'PLANT_LOOKS_HEALTHY',
    label: 'Plant looks healthy',
    helper: 'Everything looks fine, so this task can wait.',
  },
  {
    value: 'RAIN_HANDLED_WATERING',
    label: 'Rain handled it',
    helper: 'Outdoor watering was covered by rain.',
  },
  {
    value: 'TOO_BUSY',
    label: 'Too busy',
    helper: 'Skip for now without changing care assumptions.',
  },
  {
    value: 'OTHER',
    label: 'Other reason',
    helper: 'Capture anything else in the optional note.',
  },
] as const;

type TaskSkipReasonOption = (typeof TASK_SKIP_REASONS)[number];

const GENERAL_TASK_SKIP_REASONS = [
  {
    value: 'PLANT_LOOKS_HEALTHY',
    label: 'Not needed today',
    helper: 'The plant looks fine and this non-critical care can wait.',
  },
  {
    value: 'TOO_BUSY',
    label: 'Too busy',
    helper: 'Skip for now without changing care assumptions.',
  },
  {
    value: 'OTHER',
    label: 'Other reason',
    helper: 'Capture anything else in the optional note.',
  },
] as const satisfies readonly TaskSkipReasonOption[];

export const TASK_SKIP_REASONS_BY_TYPE: Partial<Record<string, readonly TaskSkipReasonOption[]>> = {
  WATER: TASK_SKIP_REASONS,
  CHECK_MOISTURE: TASK_SKIP_REASONS,
};

export type TaskSkipReason = (typeof TASK_SKIP_REASONS)[number]['value'];

export interface TaskSkipFeedback {
  reason?: TaskSkipReason;
  note?: string;
}

export function skipReasonLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return TASK_SKIP_REASONS.find((r) => r.value === reason)?.label ?? reason;
}

export function skipReasonsForTask(taskType: string) {
  return TASK_SKIP_REASONS_BY_TYPE[taskType] ?? GENERAL_TASK_SKIP_REASONS;
}

export const TASK_COMPLETE_REASONS = [
  {
    value: 'SOIL_VERY_DRY',
    label: 'Soil was very dry',
    helper: 'It felt dry deeper down, so watering was needed earlier.',
  },
  {
    value: 'PLANT_LOOKS_STRESSED',
    label: 'Plant looked stressed',
    helper: 'Leaves/leaf posture looked like it needed water.',
  },
  {
    value: 'PLANT_LOOKS_HEALTHY',
    label: 'Plant looked healthy',
    helper: 'It was time for routine care — nothing seemed urgent.',
  },
  {
    value: 'OTHER',
    label: 'Other reason',
    helper: 'Add details in the optional note.',
  },
] as const;

export const NON_WATER_COMPLETE_REASONS = [
  {
    value: 'ROUTINE_CARE_DONE',
    label: 'Routine care done',
    helper: 'The task was completed as planned.',
  },
  {
    value: 'PLANT_LOOKS_HEALTHY',
    label: 'Plant looked healthy',
    helper: 'No urgent issue, just normal care.',
  },
  {
    value: 'PLANT_LOOKS_STRESSED',
    label: 'Plant needed attention',
    helper: 'The plant showed stress or symptoms worth noting.',
  },
  {
    value: 'OTHER',
    label: 'Other result',
    helper: 'Add details in the optional note.',
  },
] as const;

export function completeReasonsForTask(taskType: string) {
  return taskType === 'WATER' ? TASK_COMPLETE_REASONS : NON_WATER_COMPLETE_REASONS;
}

export type TaskCompleteReason =
  | (typeof TASK_COMPLETE_REASONS)[number]['value']
  | (typeof NON_WATER_COMPLETE_REASONS)[number]['value'];

export interface TaskCompleteFeedback {
  reason?: TaskCompleteReason;
  note?: string;
}

export function completeReasonLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return (
    [...TASK_COMPLETE_REASONS, ...NON_WATER_COMPLETE_REASONS].find((r) => r.value === reason)
      ?.label ?? reason
  );
}

export interface TaskFeedbackRecord {
  action?: string;
  reason?: string;
  note?: string | null;
}

/**
 * Picks the feedback row that explains a terminal task, matching its action to
 * the task status. A task may also carry SNOOZE rows (reschedules); those are
 * never the complete/skip reason, so returning them would mislabel history.
 */
export function pickTerminalFeedback(
  feedback: TaskFeedbackRecord[] | undefined,
  status: string,
): TaskFeedbackRecord | undefined {
  if (!feedback?.length) return undefined;
  const action = status === 'SKIPPED' ? 'SKIP' : 'COMPLETE';
  return feedback.find((entry) => entry.action === action);
}

/** Number of times a task was snoozed/rescheduled. */
export function countSnoozeFeedback(feedback: TaskFeedbackRecord[] | undefined): number {
  return feedback?.filter((entry) => entry.action === 'SNOOZE').length ?? 0;
}
