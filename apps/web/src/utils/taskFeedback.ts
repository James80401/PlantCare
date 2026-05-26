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

export type TaskSkipReason = (typeof TASK_SKIP_REASONS)[number]['value'];

export interface TaskSkipFeedback {
  reason?: TaskSkipReason;
  note?: string;
}

export function skipReasonLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return TASK_SKIP_REASONS.find((r) => r.value === reason)?.label ?? reason;
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

export type TaskCompleteReason = (typeof TASK_COMPLETE_REASONS)[number]['value'];

export interface TaskCompleteFeedback {
  reason?: TaskCompleteReason;
  note?: string;
}

export function completeReasonLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return TASK_COMPLETE_REASONS.find((r) => r.value === reason)?.label ?? reason;
}
