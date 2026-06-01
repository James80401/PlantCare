import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateGardenDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;
}
