import { IsOptional, IsString } from 'class-validator';

export class UpdatePlantDto {
  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
