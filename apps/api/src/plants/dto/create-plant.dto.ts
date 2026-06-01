import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { PotSize } from '@prisma/client';

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
