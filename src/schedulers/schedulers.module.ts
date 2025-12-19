import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { IconRetryScheduler } from './icon-retry.scheduler';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OnboardModule } from 'src/onboard/onboard.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    OnboardModule, // 导入 OnboardModule 以使用 IconService
  ],
  providers: [IconRetryScheduler],
})
export class SchedulersModule {}

