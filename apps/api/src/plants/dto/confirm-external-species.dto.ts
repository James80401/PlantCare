import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class ConfirmExternalSpeciesDto {
  @IsIn(['plantnet', 'demo'])
  provider!: 'plantnet' | 'demo';

  @IsString()
  @MaxLength(160)
  commonName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  scientificName?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  providerMatchId?: string;
}
