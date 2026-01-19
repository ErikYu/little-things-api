import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminCategoryService } from './admin-category.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateSequenceDto,
} from './dto';

@Controller('admin-category')
@UseGuards(AdminAuthGuard)
export class AdminCategoryController {
  constructor(private readonly service: AdminCategoryService) {}

  @Get()
  async getTree() {
    try {
      return await this.service.getTree();
    } catch (error) {
      throw new HttpException(
        `Query failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  async create(@Body() createDto: CreateCategoryDto) {
    try {
      return await this.service.create(createDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Create failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('sequence')
  async updateSequence(@Body() updateDto: UpdateSequenceDto) {
    try {
      return await this.service.updateSequence(updateDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Update sequence failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
    try {
      return await this.service.update(id, updateDto);
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    try {
      return await this.service.delete(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Delete failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
