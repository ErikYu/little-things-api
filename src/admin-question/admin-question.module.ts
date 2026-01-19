import { Module } from '@nestjs/common';
import { AdminQuestionController } from './admin-question.controller';
import { AdminQuestionService } from './admin-question.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminQuestionController],
  providers: [AdminQuestionService],
})
export class AdminQuestionModule {}
