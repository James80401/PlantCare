import { BuddyTrait } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateBuddyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  name?: string;

  @IsOptional()
  @IsEnum(BuddyTrait)
  trait?: BuddyTrait;
}
