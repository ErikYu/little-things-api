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

  /**
   * 获取用户在一个问题下面的所有回答
   */
  async getAnswers(
    userId: string,
    questionId: string,
    limit?: number,
    cursor?: string,
  ) {
    // 构建查询条件
    const whereCondition: {
      user_id: string;
      question_id: string;
      created_at?: { lt: Date };
    } = {
      user_id: userId,
      question_id: questionId,
    };

    // 如果有 cursor，添加时间过滤条件
    if (cursor) {
      whereCondition.created_at = {
        lt: new Date(cursor),
      };
    }

    // 获取分页的回答数据
    const answers = await this.prisma.answer.findMany({
      where: whereCondition,
      select: {
        id: true,
        content: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit ? limit + 1 : undefined, // 如果没有limit，则获取全部数据
    });

    // 判断是否有更多数据
    const hasMore = limit ? answers.length > limit : false;
    const actualAnswers = hasMore ? answers.slice(0, limit) : answers;

    // 获取统计信息（需要单独查询，因为分页会影响统计）
    const [totalCount, firstAnswer, lastAnswer] = await Promise.all([
      this.prisma.answer.count({
        where: {
          user_id: userId,
          question_id: questionId,
        },
      }),
      this.prisma.answer.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
        },
        select: { created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.answer.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
        },
        select: { created_at: true },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    // 计算统计信息
    const daysOver = firstAnswer
      ? dayjs().diff(dayjs(firstAnswer.created_at), 'day') + 1
      : 0;
    const nextCursor =
      hasMore && actualAnswers.length > 0
        ? actualAnswers[actualAnswers.length - 1].created_at.toISOString()
        : null;

    return {
      summary: {
        daysOver,
        totalAnswers: totalCount,
        firstAnswerAt: firstAnswer
          ? dayjs(firstAnswer.created_at).format('YYYY-MM-DD')
          : null,
        lastAnswerAt: lastAnswer
          ? dayjs(lastAnswer.created_at).format('YYYY-MM-DD')
          : null,
      },
      answers: actualAnswers.map(answer => ({
        id: answer.id,
        content: answer.content,
        created_at: dayjs(answer.created_at).format('YYYY-MM-DD'),
      })),
      pagination: {
        limit: limit || null,
        hasMore,
        nextCursor,
      },
    };
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
