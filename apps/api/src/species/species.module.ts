import { Module } from '@nestjs/common';
import { SpeciesController } from './species.controller';
import { PerenualService } from './perenual.service';
import { SpeciesRecommendationsService } from './species-recommendations.service';

@Module({
  controllers: [SpeciesController],
  providers: [PerenualService, SpeciesRecommendationsService],
  exports: [PerenualService, SpeciesRecommendationsService],
})
export class SpeciesModule {}
