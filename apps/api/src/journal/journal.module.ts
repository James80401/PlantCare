import { Module } from '@nestjs/common';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
