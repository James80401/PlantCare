export const SNOOZE_OPTIONS = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: 'In 3 days' },
  { days: 7, label: 'In 1 week' },
] as const;

export type SnoozeDays = (typeof SNOOZE_OPTIONS)[number]['days'];

export async function snoozeTasksSequentially(
  ids: string[],
  days: SnoozeDays,
  snooze: (id: string, days: SnoozeDays) => Promise<unknown>,
) {
  for (const id of new Set(ids)) {
    await snooze(id, days);
  }
}
