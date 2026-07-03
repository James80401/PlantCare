import { Module } from '@nestjs/common';
import { AiUsageModule } from '../ai-usage/ai-usage.module';
import { ImageModerationModule } from '../common/image-moderation.module';
import { PlantMilestonesModule } from '../milestones/plant-milestones.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { UploadModule } from '../upload/upload.module';
import { PlantProgressController } from './plant-progress.controller';
import { PlantProgressService } from './plant-progress.service';

@Module({
  imports: [UploadModule, ImageModerationModule, AiUsageModule, RecommendationsModule, PlantMilestonesModule],
  controllers: [PlantProgressController],
  providers: [PlantProgressService],
})
export class PlantProgressModule {}
