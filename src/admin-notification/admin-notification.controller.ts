import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminNotificationService } from './admin-notification.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { SendNotificationDto } from './dto';

@Controller('admin-notification')
@UseGuards(AdminAuthGuard)
export class AdminNotificationController {
  constructor(
    private readonly adminNotificationService: AdminNotificationService,
  ) {}

  @Post('send')
  async sendNotification(@Body() dto: SendNotificationDto) {
    try {
      if (!dto?.userId || !dto?.body) {
        throw new HttpException(
          'userId and body are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.adminNotificationService.sendNotification(dto);
    } catch (error) {
      throw new HttpException(
        `Send notification failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('history')
  async getHistory(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    try {
      return await this.adminNotificationService.getHistory(
        Number(page),
        Number(pageSize),
      );
    } catch (error: unknown) {
      throw new HttpException(
        `Get history failed: ${error instanceof Error ? error.message : String(error)}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
