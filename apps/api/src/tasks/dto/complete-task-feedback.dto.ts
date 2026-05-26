import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const TASK_COMPLETE_REASONS = [
  'SOIL_VERY_DRY',
  'PLANT_LOOKS_STRESSED',
  'PLANT_LOOKS_HEALTHY',
  'OTHER',
] as const;

export type TaskCompleteReason = (typeof TASK_COMPLETE_REASONS)[number];

export class CompleteTaskFeedbackDto {
  @IsOptional()
  @IsIn(TASK_COMPLETE_REASONS)
  reason?: TaskCompleteReason;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}

