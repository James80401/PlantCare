import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';

function normalizedChoice({ value }: { value: unknown }) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class UpdateCarePreferencesDto {
  @IsOptional()
  @Transform(normalizedChoice)
  @IsIn(['beginner', 'intermediate', 'advanced', 'expert'])
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @IsOptional()
  @Transform(normalizedChoice)
  @IsIn(['low', 'medium', 'high'])
  defaultLightLevel?: 'low' | 'medium' | 'high';
}
