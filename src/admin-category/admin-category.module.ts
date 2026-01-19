import { Module } from '@nestjs/common';
import { AdminCategoryController } from './admin-category.controller';
import { AdminCategoryService } from './admin-category.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [PrismaModule, AdminAuthModule],
  controllers: [AdminCategoryController],
  providers: [AdminCategoryService],
})
export class AdminCategoryModule {}
