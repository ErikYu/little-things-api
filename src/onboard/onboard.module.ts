import { Module } from '@nestjs/common';
import { OnboardController } from './onboard.controller';
import { OnboardService } from './onboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OnboardController],
  providers: [OnboardService],
  exports: [OnboardService],
})
export class OnboardModule {}
