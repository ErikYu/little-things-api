import { Module } from '@nestjs/common';
import { AdminNotificationController } from './admin-notification.controller';
import { AdminNotificationService } from './admin-notification.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OnboardModule } from '../onboard/onboard.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [AdminAuthModule, OnboardModule, PrismaModule],
  controllers: [AdminNotificationController],
  providers: [AdminNotificationService],
  exports: [AdminNotificationService],
})
export class AdminNotificationModule {}
