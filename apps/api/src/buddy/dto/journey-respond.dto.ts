import { IsInt, IsString, Max, Min } from 'class-validator';

export class JourneyRespondDto {
  @IsString()
  journeyId!: string;

  @IsInt()
  @Min(0)
  @Max(1)
  choice!: number;
}
