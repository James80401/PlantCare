import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PlantLifeStage, PotSize } from '@prisma/client';

export class CreatePlantDto {
  @IsString()
  gardenId!: string;

  @IsString()
  speciesId!: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(PotSize)
  potSize?: PotSize;

  @IsOptional()
  @IsEnum(PlantLifeStage)
  lifeStage?: PlantLifeStage;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1200)
  approximateAgeMonths?: number;

  @IsOptional()
  @IsDateString()
  datePlanted?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
