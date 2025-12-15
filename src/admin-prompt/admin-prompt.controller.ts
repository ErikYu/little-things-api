import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminPromptService } from './admin-prompt.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type { CreatePromptDto, UpdatePromptDto, QueryPromptDto } from './dto';

@Controller('admin-prompt')
@UseGuards(AdminAuthGuard)
export class AdminPromptController {
  constructor(private readonly adminPromptService: AdminPromptService) {}

  @Post()
  async create(@Body() createDto: CreatePromptDto) {
    try {
      return await this.adminPromptService.create(createDto);
    } catch (error) {
      throw new HttpException(
        `Create failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdatePromptDto) {
    try {
      return await this.adminPromptService.update(id, updateDto);
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
      return await this.adminPromptService.delete(id);
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

  @Get()
  async findList(@Query() queryDto: QueryPromptDto) {
    try {
      return await this.adminPromptService.findList(queryDto);
    } catch (error) {
      throw new HttpException(
        `Query failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.adminPromptService.findOne(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Query failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
