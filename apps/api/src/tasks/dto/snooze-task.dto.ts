import { IsIn, IsInt } from 'class-validator';

export const SNOOZE_DAY_OPTIONS = [1, 3, 7] as const;
export type SnoozeDays = (typeof SNOOZE_DAY_OPTIONS)[number];

export class SnoozeTaskDto {
  @IsInt()
  @IsIn(SNOOZE_DAY_OPTIONS)
  days!: SnoozeDays;
}
