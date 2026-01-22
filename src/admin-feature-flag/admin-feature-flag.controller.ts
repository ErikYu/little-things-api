import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminFeatureFlagService } from './admin-feature-flag.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type { UpdateFeatureFlagDto } from './dto';

@Controller('admin-feature-flag')
@UseGuards(AdminAuthGuard)
export class AdminFeatureFlagController {
  constructor(
    private readonly adminFeatureFlagService: AdminFeatureFlagService,
  ) {}

  @Get()
  async findAll() {
    try {
      return await this.adminFeatureFlagService.findAll();
    } catch (error) {
      throw new HttpException(
        `Query failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateFeatureFlagDto,
  ) {
    try {
      return await this.adminFeatureFlagService.update(id, updateDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Update failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
