import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { DiagnosisChatController } from './diagnosis-chat.controller';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisChatService } from './diagnosis-chat.service';
import { LlmDiagnosisService } from './llm-diagnosis.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [DiagnosisController, DiagnosisChatController],
  providers: [DiagnosisService, DiagnosisChatService, LlmDiagnosisService],
})
export class DiagnosisModule {}
