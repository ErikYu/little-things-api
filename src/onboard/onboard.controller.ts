import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardService } from './onboard.service';
import dayjs from 'dayjs';
import { ApiOperation } from '@nestjs/swagger';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@Controller()
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @ApiOperation({ summary: '获取引导页面的静态数据' })
  @Get('onboard')
  getOnboardData() {
    return this.onboardService.getOnboardData();
  }

  @ApiOperation({ summary: '获取所有分类列表' })
  @Get('categories')
  getCategories() {
    return this.onboardService.getCategories();
  }

  @ApiOperation({ summary: '获取指定分类下的第一个问题' })
  @Get('categories/:categoryId/head')
  getHead(@Param('categoryId') categoryId: string) {
    return this.onboardService.getHead(categoryId);
  }

  @ApiOperation({ summary: '获取问题列表，包含用户的星标状态' })
  @Get('questions')
  @UseGuards(AuthGuard('jwt'))
  getQuestions(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.onboardService.getQuestions(userId);
  }

  @ApiOperation({ summary: '星标或取消星标问题' })
  @Post('questions/pin')
  @UseGuards(AuthGuard('jwt'))
  pinQuestion(
    @Request() req: AuthenticatedRequest,
    @Body() body: { question_id: string; pinned: boolean },
  ) {
    const userId = req.user.userId;
    if (!body.question_id || typeof body.pinned !== 'boolean') {
      throw new BadRequestException('Question ID and pinned are required');
    }
    return this.onboardService.pinQuestion(
      userId,
      body.question_id,
      body.pinned,
    );
  }

  @ApiOperation({ summary: '创建答案' })
  @Post('answers')
  @UseGuards(AuthGuard('jwt'))
  async createAnswer(
    @Body() body: { question_id: string; content: string },
    @Request() req: AuthenticatedRequest,
  ) {
    const { question_id, content } = body;
    const userId = req.user.userId;

    return this.onboardService.createAnswer(userId, question_id, content);
  }

  @ApiOperation({ summary: '获取用户所有答案' })
  @Get('answers')
  @UseGuards(AuthGuard('jwt'))
  getAnswers(
    @Request() req: AuthenticatedRequest,
    @Query('questionId') questionId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const userId = req.user.userId;
    if (!questionId) {
      throw new BadRequestException('Question ID is required');
    }
    const pageLimit = limit ? parseInt(limit, 10) : undefined;

    return this.onboardService.getAnswers(
      userId,
      questionId,
      pageLimit,
      cursor,
    );
  }

  @ApiOperation({ summary: '获取指定月份的日历视图数据' })
  @Get('calendar-view')
  @UseGuards(AuthGuard('jwt'))
  getCalendarView(
    @Request() req: AuthenticatedRequest,
    @Query('month') month: string,
  ) {
    const userId = req.user.userId;
    if (!month) {
      month = dayjs().format('YYYY-MM');
    }
    return this.onboardService.getCalendarView(userId, month);
  }

  @ApiOperation({ summary: '获取用户已pin问题的线程视图' })
  @Get('thread-view')
  @UseGuards(AuthGuard('jwt'))
  getThreadView(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.onboardService.getThreadView(userId);
  }
}
