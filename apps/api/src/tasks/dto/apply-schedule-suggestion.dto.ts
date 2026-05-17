import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApplyScheduleSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
