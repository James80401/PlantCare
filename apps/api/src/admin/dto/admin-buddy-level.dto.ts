import { IsInt, Max, Min } from 'class-validator';

export class AdminBuddyLevelDto {
  @IsInt()
  @Min(1)
  @Max(15)
  level!: number;
}
