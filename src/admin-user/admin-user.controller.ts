import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type { UpdateDeviceTokenDto } from './dto';

@Controller('admin-user')
@UseGuards(AdminAuthGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.service.findList(Number(page), Number(pageSize));
  }

  @Get('with-device-token')
  async findUsersWithDeviceToken() {
    return this.service.findUsersWithDeviceToken();
  }

  @Put(':id/device-token')
  async updateDeviceToken(
    @Param('id') id: string,
    @Body() updateDto: UpdateDeviceTokenDto,
  ) {
    try {
      return await this.service.updateDeviceToken(id, updateDto.device_token);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Update device token failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

