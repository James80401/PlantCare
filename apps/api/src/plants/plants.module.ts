import { Module } from '@nestjs/common';
import { PlantsController } from './plants.controller';
import { PlantsService } from './plants.service';
import { PlantNetService } from './plantnet.service';
import { CareGuidesModule } from '../care-guides/care-guides.module';
import { SchedulerModule } from '../scheduler/scheduler.module';
import { SpeciesModule } from '../species/species.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [CareGuidesModule, SchedulerModule, SpeciesModule, UploadModule],
  controllers: [PlantsController],
  providers: [PlantsService, PlantNetService],
  exports: [PlantsService],
})
export class PlantsModule {}
