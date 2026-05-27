import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class ApplyRecoveryTasksDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keys!: string[];
}
