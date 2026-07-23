import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendDiagnosisMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  message?: string;

  @IsOptional()
  @IsUUID()
  requestId?: string;
}
