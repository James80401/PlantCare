import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SpeciesModule } from './species/species.module';
import { PlantsModule } from './plants/plants.module';
import { TasksModule } from './tasks/tasks.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { JournalModule } from './journal/journal.module';
import { DiagnosisModule } from './diagnosis/diagnosis.module';
import { BillingModule } from './billing/billing.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WeatherModule } from './weather/weather.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { GardensModule } from './gardens/gardens.module';
import { CommunityModule } from './community/community.module';
import { BuddyModule } from './buddy/buddy.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '../../.env'),
      ],
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PrismaModule,
    EmailModule,
    AuthModule,
    UsersModule,
    SpeciesModule,
    PlantsModule,
    TasksModule,
    SchedulerModule,
    JournalModule,
    DiagnosisModule,
    BillingModule,
    NotificationsModule,
    WeatherModule,
    DashboardModule,
    UploadModule,
    GardensModule,
    CommunityModule,
    BuddyModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
