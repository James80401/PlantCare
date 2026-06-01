import { BuddyTrait } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const BUDDY_COMPANION_MODES = ['visible', 'minimized', 'hidden'] as const;

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

  @IsOptional()
  @IsString()
  @IsIn(BUDDY_COMPANION_MODES)
  floatingCompanionMode?: (typeof BUDDY_COMPANION_MODES)[number];
}
