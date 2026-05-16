import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PotSize } from '@prisma/client';

export class CreatePlantDto {
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
  @IsDateString()
  datePlanted?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
