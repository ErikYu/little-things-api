import { Module } from '@nestjs/common';
import { AdminPromptController } from './admin-prompt.controller';
import { AdminPromptService } from './admin-prompt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminPromptController],
  providers: [AdminPromptService],
  exports: [AdminPromptService],
})
export class AdminPromptModule {}

