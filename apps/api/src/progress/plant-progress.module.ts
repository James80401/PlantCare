import { Module } from '@nestjs/common';
import { AiUsageModule } from '../ai-usage/ai-usage.module';
import { ImageModerationModule } from '../common/image-moderation.module';
import { UploadModule } from '../upload/upload.module';
import { PlantProgressController } from './plant-progress.controller';
import { PlantProgressService } from './plant-progress.service';

@Module({
  imports: [UploadModule, ImageModerationModule, AiUsageModule],
  controllers: [PlantProgressController],
  providers: [PlantProgressService],
})
export class PlantProgressModule {}
