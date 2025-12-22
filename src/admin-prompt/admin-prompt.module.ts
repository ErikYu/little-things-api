import { Module } from '@nestjs/common';
import { AdminPromptController } from './admin-prompt.controller';
import { AdminPromptService } from './admin-prompt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OnboardModule } from '../onboard/onboard.module';

@Module({
  imports: [PrismaModule, AdminAuthModule, OnboardModule],
  controllers: [AdminPromptController],
  providers: [AdminPromptService],
  exports: [AdminPromptService],
})
export class AdminPromptModule {}
