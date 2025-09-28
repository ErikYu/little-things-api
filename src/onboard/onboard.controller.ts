import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardService } from './onboard.service';

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
}
