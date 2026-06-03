import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
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
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  imageUrl?: string;
}
