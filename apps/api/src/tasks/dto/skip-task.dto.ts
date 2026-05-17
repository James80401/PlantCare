import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const TASK_SKIP_REASONS = [
  'SOIL_STILL_WET',
  'PLANT_LOOKS_HEALTHY',
  'RAIN_HANDLED_WATERING',
  'TOO_BUSY',
  'OTHER',
] as const;

export type TaskSkipReason = (typeof TASK_SKIP_REASONS)[number];

export class SkipTaskDto {
  @IsOptional()
  @IsIn(TASK_SKIP_REASONS)
  reason?: TaskSkipReason;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
