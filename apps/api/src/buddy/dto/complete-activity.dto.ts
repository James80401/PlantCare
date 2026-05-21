import { ActivityType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

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
}
