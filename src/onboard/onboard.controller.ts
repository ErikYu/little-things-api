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

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}

@Controller()
export class OnboardController {
  constructor(private readonly onboardService: OnboardService) {}

  @Get('onboard')
  getOnboardData() {
    return this.onboardService.getOnboardData();
  }

  @Get('categories')
  getCategories() {
    return this.onboardService.getCategories();
  }

  @Get('categories/:categoryId/head')
  getHead(@Param('categoryId') categoryId: string) {
    return this.onboardService.getHead(categoryId);
  }

  @Get('questions')
  @UseGuards(AuthGuard('jwt'))
  getQuestions(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.onboardService.getQuestions(userId);
  }

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

  @Get('answers/question/:questionId')
  async getAnswersByQuestion(@Param('questionId') questionId: string) {
    return this.onboardService.getAnswersByQuestion(questionId);
  }

  @Get('answers')
  @UseGuards(AuthGuard('jwt'))
  async getAnswersByUser(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.onboardService.getAnswersByUser(userId);
  }

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

  @Get('thread-view')
  @UseGuards(AuthGuard('jwt'))
  getThreadView(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.onboardService.getThreadView(userId);
  }
}
