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
