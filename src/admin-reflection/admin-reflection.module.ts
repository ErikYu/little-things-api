import { Module } from '@nestjs/common';
import { AdminReflectionController } from './admin-reflection.controller';
import { AdminReflectionService } from './admin-reflection.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OnboardModule } from '../onboard/onboard.module';
import { SchedulersModule } from '../schedulers/schedulers.module';

@Module({
  imports: [PrismaModule, AdminAuthModule, OnboardModule, SchedulersModule],
  controllers: [AdminReflectionController],
  providers: [AdminReflectionService],
})
export class AdminReflectionModule {}
