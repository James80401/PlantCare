import { Module } from '@nestjs/common';
import { SpeciesController } from './species.controller';
import { PerenualService } from './perenual.service';

@Module({
  controllers: [SpeciesController],
  providers: [PerenualService],
  exports: [PerenualService],
})
export class SpeciesModule {}
