import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  GROWTH_CHANGE_VALUES,
  LEAF_CONDITION_VALUES,
  OVERALL_HEALTH_VALUES,
  PEST_SIGNS_VALUES,
  RECENT_CARE_VALUES,
  SOIL_MOISTURE_VALUES,
} from './create-plant-progress.dto';

const emptyToNull = ({ value }: { value: unknown }) => (value === '' ? null : value);

export class UpdatePlantProgressDto {
  @IsOptional()
  @IsIn(OVERALL_HEALTH_VALUES)
  overallHealth?: string;

  @IsOptional()
  @Transform(emptyToNull)
  @IsIn(GROWTH_CHANGE_VALUES)
  growthChange?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsIn(LEAF_CONDITION_VALUES)
  leafCondition?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsIn(SOIL_MOISTURE_VALUES)
  soilMoisture?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsIn(PEST_SIGNS_VALUES)
  pestSigns?: string | null;

  @IsOptional()
  @Transform(emptyToNull)
  @IsIn(RECENT_CARE_VALUES)
  recentCare?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  removePhoto?: boolean;
}
