import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const OVERALL_HEALTH_VALUES = ['THRIVING', 'STABLE', 'CONCERNED', 'DECLINING'] as const;
export const GROWTH_CHANGE_VALUES = [
  'NEW_GROWTH',
  'SAME',
  'LEAF_LOSS',
  'STRETCHING',
  'FLOWERING',
  'NOT_SURE',
] as const;
export const LEAF_CONDITION_VALUES = [
  'HEALTHY',
  'YELLOWING',
  'BROWN_TIPS',
  'SPOTS',
  'DROOPING',
  'WILTING',
  'PEST_DAMAGE',
  'NOT_SURE',
] as const;
export const SOIL_MOISTURE_VALUES = ['DRY', 'SLIGHTLY_DRY', 'MOIST', 'WET', 'NOT_CHECKED'] as const;
export const PEST_SIGNS_VALUES = [
  'NONE',
  'POSSIBLE',
  'VISIBLE_PESTS',
  'WEBBING',
  'STICKY_RESIDUE',
  'NOT_CHECKED',
] as const;
export const RECENT_CARE_VALUES = [
  'WATERED',
  'FERTILIZED',
  'REPOTTED',
  'PRUNED',
  'MOVED_LIGHT',
  'PEST_TREATED',
  'NO_CHANGE',
  'MULTIPLE',
] as const;

export class CreatePlantProgressDto {
  @IsIn(OVERALL_HEALTH_VALUES)
  overallHealth!: string;

  @IsOptional()
  @IsIn(GROWTH_CHANGE_VALUES)
  growthChange?: string;

  @IsOptional()
  @IsIn(LEAF_CONDITION_VALUES)
  leafCondition?: string;

  @IsOptional()
  @IsIn(SOIL_MOISTURE_VALUES)
  soilMoisture?: string;

  @IsOptional()
  @IsIn(PEST_SIGNS_VALUES)
  pestSigns?: string;

  @IsOptional()
  @IsIn(RECENT_CARE_VALUES)
  recentCare?: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  taskId?: string;
}
