import { Module } from '@nestjs/common';
import { PlantMilestonesService } from './plant-milestones.service';

@Module({
  providers: [PlantMilestonesService],
  exports: [PlantMilestonesService],
})
export class PlantMilestonesModule {}
