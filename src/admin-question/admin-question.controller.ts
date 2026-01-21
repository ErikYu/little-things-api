import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminQuestionService } from './admin-question.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import type {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionDto,
} from './dto';

@Controller('admin-question')
@UseGuards(AdminAuthGuard)
export class AdminQuestionController {
  constructor(private readonly service: AdminQuestionService) {}

  @Get('categories')
  async getCategories() {
    return await this.service.getCategories();
  }

  @Get('qod-fixed')
  async getFixedQoDQuestions() {
    try {
      return await this.service.getFixedQoDQuestions();
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

  @Post('qod-fixed/:questionId')
  async addFixedQoDQuestion(@Param('questionId') questionId: string) {
    try {
      return await this.service.addFixedQoDQuestion(questionId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Add failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('qod-fixed/:questionId')
  async removeFixedQoDQuestion(@Param('questionId') questionId: string) {
    try {
      return await this.service.removeFixedQoDQuestion(questionId);
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

  @Put('qod-fixed/reorder')
  async reorderFixedQoDQuestions(@Body() body: { questionIds: string[] }) {
    try {
      return await this.service.reorderFixedQoDQuestions(body.questionIds);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Reorder failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findList(@Query() queryDto: QueryQuestionDto) {
    try {
      return await this.service.findList(queryDto);
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
      return await this.service.findOne(id);
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

  @Post()
  async create(@Body() createDto: CreateQuestionDto) {
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

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateQuestionDto) {
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
