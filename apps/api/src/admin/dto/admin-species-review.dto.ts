import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminSpeciesReviewDto {
  @IsIn(['reviewed', 'curated'])
  status!: 'reviewed' | 'curated';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
