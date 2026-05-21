import { ActivityType } from '@prisma/client';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompleteActivityDto {
  @IsEnum(ActivityType)
  activityType!: ActivityType;

  @IsOptional()
  @IsString()
  plantId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  /** Watering check: plants watered (marks pending WATER tasks complete). */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plantIds?: string[];
}
