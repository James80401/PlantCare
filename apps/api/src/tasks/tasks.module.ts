import { Module } from '@nestjs/common';
import { CareGuidesModule } from '../care-guides/care-guides.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [SchedulerModule, CareGuidesModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
