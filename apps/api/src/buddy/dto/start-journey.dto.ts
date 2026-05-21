import { IsOptional, IsString } from 'class-validator';

export class StartJourneyDto {
  @IsOptional()
  @IsString()
  biomeId?: string;
}
