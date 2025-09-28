import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { OnboardModule } from './onboard/onboard.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [AuthModule, OnboardModule, ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
