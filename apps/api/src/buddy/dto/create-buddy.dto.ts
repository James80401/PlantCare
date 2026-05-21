import { BuddyTrait } from '@prisma/client';
import { IsEnum, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

const STARTER_SPECIES = ['monstera', 'cactus', 'succulent', 'snake_plant', 'fern'] as const;

export class CreateBuddyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  name!: string;

  @IsString()
  @IsIn([...STARTER_SPECIES])
  speciesId!: string;

  @IsEnum(BuddyTrait)
  trait!: BuddyTrait;
}
