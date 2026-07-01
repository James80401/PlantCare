import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';

export class AdminSpeciesReviewDto {
  @IsOptional()
  @IsIn(['reviewed', 'curated'])
  status?: 'reviewed' | 'curated';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  sunlight?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  wateringFreqDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  toxicity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1200)
  careNotes?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  defaultImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceNote?: string;

  @IsOptional()
  @IsIn(['unreviewed', 'approved', 'needs_better_image'])
  photoReviewStatus?: 'unreviewed' | 'approved' | 'needs_better_image';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  photoReviewNote?: string;
}
