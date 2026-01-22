import { Module } from '@nestjs/common';
import { AdminFeatureFlagController } from './admin-feature-flag.controller';
import { AdminFeatureFlagService } from './admin-feature-flag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminFeatureFlagController],
  providers: [AdminFeatureFlagService],
  exports: [AdminFeatureFlagService],
})
export class AdminFeatureFlagModule {}
