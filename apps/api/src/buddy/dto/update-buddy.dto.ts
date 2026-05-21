import { BuddyTrait } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateBuddyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  name?: string;

  @IsOptional()
  @IsEnum(BuddyTrait)
  trait?: BuddyTrait;

  @IsOptional()
  @IsString()
  speciesId?: string;

  @IsOptional()
  @IsObject()
  equippedItems?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  terrariumLayout?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  terrariumBackground?: string;
}
