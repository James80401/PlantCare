export const SNOOZE_OPTIONS = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: 'In 3 days' },
  { days: 7, label: 'In 1 week' },
] as const;

export type SnoozeDays = (typeof SNOOZE_OPTIONS)[number]['days'];
