import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OnboardController } from './onboard.controller';
import { OnboardService } from './onboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IconService } from './icon.service';
import { IconController } from './icon.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [OnboardController, IconController],
  providers: [OnboardService, IconService],
  exports: [OnboardService, IconService],
})
export class OnboardModule {}
