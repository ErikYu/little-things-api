import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OnboardService {
  constructor(private readonly prisma: PrismaService) {}
  getOnboardData() {
    return {
      page1st: 'the little things',
      page2nd: `big thoughts, \ntiny moments.`,
      page3rd: 'grow your reflections\ninto insights with\nguided questions',
      page4th: `each answer will generate\na unique icon of your own`,
    };
  }

  getCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        sequence: 'asc',
      },
    });
  }

  getHead(categoryId: string) {
    return this.prisma.question.findFirst({
      where: {
        category_id: categoryId,
      },
      select: {
        id: true,
        title: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async createAnswer(userId: string, questionId: string, content: string) {
    // 验证问题是否存在并获取标题
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // 创建答案
    const answer = await this.prisma.answer.create({
      data: {
        content,
        user_id: userId,
        question_id: questionId,
        question_snapshot: question.title,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        question: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return answer;
  }

  async getAnswersByQuestion(questionId: string) {
    return this.prisma.answer.findMany({
      where: { question_id: questionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAnswersByUser(userId: string) {
    return this.prisma.answer.findMany({
      where: { user_id: userId },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
