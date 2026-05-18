import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FollowUpTaskDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  dueInDays?: number = 3;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
