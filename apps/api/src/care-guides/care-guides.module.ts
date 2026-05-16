import { Module } from '@nestjs/common';
import { CareGuidesService } from './care-guides.service';

@Module({
  providers: [CareGuidesService],
  exports: [CareGuidesService],
})
export class CareGuidesModule {}
