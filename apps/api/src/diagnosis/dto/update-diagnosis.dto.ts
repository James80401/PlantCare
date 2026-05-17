import { IsBoolean } from 'class-validator';

export class UpdateDiagnosisDto {
  @IsBoolean()
  resolved!: boolean;
}
