import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PotSize } from '@prisma/client';

export class UpdatePlantDto {
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
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
