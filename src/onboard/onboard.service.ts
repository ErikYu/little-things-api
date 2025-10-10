import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs from 'dayjs';
import { Answer } from '@prisma/client';

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

  async getQuestions(userId: string) {
    // 获取用户已pin的问题ID列表
    const pinnedQuestions = await this.prisma.questionUserPinned.findMany({
      where: { user_id: userId },
      select: { question_id: true },
    });

    const pinnedQuestionIds = new Set(pinnedQuestions.map(p => p.question_id));

    // 获取所有分类和问题
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        questions: {
          select: {
            id: true,
            title: true,
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
      orderBy: {
        sequence: 'asc',
      },
    });

    // 为每个问题添加isPinned字段
    return categories.map(category => ({
      ...category,
      questions: category.questions.map(question => ({
        ...question,
        pinned: pinnedQuestionIds.has(question.id),
      })),
    }));
  }

  async pinQuestion(userId: string, questionId: string, pinned: boolean) {
    if (pinned) {
      // 检查是否已存在，不存在则新增
      const existingPin = await this.prisma.questionUserPinned.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
        },
      });

      if (!existingPin) {
        await this.prisma.questionUserPinned.create({
          data: {
            user_id: userId,
            question_id: questionId,
          },
        });
      }
    } else {
      // 删除对应的记录
      await this.prisma.questionUserPinned.deleteMany({
        where: {
          user_id: userId,
          question_id: questionId,
        },
      });
    }

    return { question_id: questionId, pinned };
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

  async getCalendarView(userId: string, month: string) {
    // 解析月份参数，格式: YYYY-MM
    const startDate = dayjs(`${month}-01`).startOf('month');
    const endDate = startDate.endOf('month');

    // 获取当月所有回答，按创建时间排序
    const answers = await this.prisma.answer.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: startDate.toDate(),
          lte: endDate.toDate(),
        },
      },
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
      orderBy: {
        created_at: 'asc',
      },
    });

    // 按日期分组，取每天第一个回答
    const dailyFirstAnswers = new Map<string, Answer>();

    answers.forEach(answer => {
      const dateKey = dayjs(answer.created_at).format('YYYY-MM-DD');
      if (!dailyFirstAnswers.has(dateKey)) {
        dailyFirstAnswers.set(dateKey, answer);
      }
    });

    // 生成当月所有日期，确保返回完整月份
    const result: Array<{ date: string; first: any }> = [];
    const daysInMonth = endDate.date();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = startDate.date(day);
      const dateKey = currentDate.format('YYYY-MM-DD');
      const firstAnswer = dailyFirstAnswers.get(dateKey);

      if (firstAnswer) {
        result.push({
          date: dateKey,
          first: {
            id: firstAnswer.id,
            content: firstAnswer.content,
          },
        });
      }
    }

    return result;
  }

  async getThreadView(userId: string) {
    // 获取用户已pin的问题
    const pinnedQuestions = await this.prisma.questionUserPinned.findMany({
      where: { user_id: userId },
      include: {
        question: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        question: {
          sequence: 'asc',
        },
      },
    });

    // 为每个pin的问题获取用户最新的3个答案
    const result = await Promise.all(
      pinnedQuestions.map(async pinnedQuestion => {
        const answers = await this.prisma.answer.findMany({
          where: {
            user_id: userId,
            question_id: pinnedQuestion.question_id,
          },
          select: {
            id: true,
            content: true,
            created_at: true,
          },
          orderBy: { created_at: 'desc' },
          take: 3,
        });

        return {
          ...pinnedQuestion.question,
          answers,
        };
      }),
    );

    return result;
  }
}
