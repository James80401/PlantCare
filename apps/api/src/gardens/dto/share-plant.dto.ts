import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SharePlantDto {
  @IsString()
  plantId!: string;

  @IsOptional()
  @IsBoolean()
  canComplete?: boolean;

  @IsOptional()
  @IsBoolean()
  canJournal?: boolean;
}
