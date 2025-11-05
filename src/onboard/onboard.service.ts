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
    cursor?: number,
  ) {
    // 构建查询条件
    const whereCondition: {
      user_id: string;
      question_id: string;
      sequence?: { lt: number };
    } = {
      user_id: userId,
      question_id: questionId,
    };

    // 如果有 cursor，添加 sequence 过滤条件
    if (cursor) {
      whereCondition.sequence = {
        lt: cursor,
      };
    }

    // 获取分页的回答数据
    const answers = await this.prisma.answer.findMany({
      where: whereCondition,
      select: {
        id: true,
        sequence: true,
        content: true,
        created_ymd: true,
        created_tms: true,
      },
      orderBy: {
        sequence: 'desc',
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
        select: { created_at: true, created_ymd: true },
        orderBy: { sequence: 'asc' },
      }),
      this.prisma.answer.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
        },
        select: { created_at: true, created_ymd: true },
        orderBy: { sequence: 'desc' },
      }),
    ]);

    // 计算统计信息
    const daysOver = firstAnswer
      ? dayjs().diff(dayjs(firstAnswer.created_at), 'day') + 1
      : 0;
    const nextCursor =
      hasMore && actualAnswers.length > 0
        ? actualAnswers[actualAnswers.length - 1].sequence
        : null;

    return {
      summary: {
        daysOver,
        totalAnswers: totalCount,
        firstAnswerAt: firstAnswer ? firstAnswer.created_ymd : null,
        lastAnswerAt: lastAnswer ? lastAnswer.created_ymd : null,
      },
      answers: actualAnswers.map(answer => ({
        id: answer.id,
        content: answer.content,
        created_ymd: answer.created_ymd,
        created_tms: answer.created_tms,
      })),
      pagination: {
        limit: limit || null,
        hasMore,
        nextCursor,
      },
    };
  }

  async createAnswer(
    userId: string,
    questionId: string,
    content: string,
    created_tms: string,
  ) {
    // 验证问题是否存在并获取标题
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const createdYmd = dayjs(created_tms).format('YYYY-MM-DD');
    // const createdTms = dayjs(created_at).format('YYYY-MM-DD HH:mm:ss');

    // 创建答案
    const answer = await this.prisma.answer.create({
      omit: {
        created_at: true,
        updated_at: true,
        sequence: true,
        user_id: true,
        question_id: true,
      },
      data: {
        content,
        user_id: userId,
        question_id: questionId,
        question_snapshot: question.title,
        created_ymd: createdYmd,
        created_tms: created_tms,
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

  async getCalendarView(
    userId: string,
    { start, end }: { start: string; end: string },
  ) {
    let startDate = '';
    let endDate = '';
    if (start && end) {
      startDate = start;
      endDate = end;
    }

    // 获取当月所有回答，按创建时间排序
    const answers = await this.prisma.answer.findMany({
      where: {
        user_id: userId,
        created_ymd: {
          gte: startDate,
          lte: endDate,
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

    // 按日期分组所有回答
    const dailyAnswers = new Map<string, Answer[]>();

    answers.forEach(answer => {
      const dateKey = answer.created_ymd;
      if (!dailyAnswers.has(dateKey)) {
        dailyAnswers.set(dateKey, []);
      }
      dailyAnswers.get(dateKey)!.push(answer);
    });

    const result: Array<{ date: string; reflections: any[] }> = [];

    // 遍历 Map，组装结果数组
    dailyAnswers.forEach((dayAnswers, date) => {
      result.push({
        date,
        reflections: dayAnswers.map(answer => ({
          id: answer.id,
          content: answer.content,
          created_ymd: answer.created_ymd,
        })),
      });
    });

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
            created_ymd: true,
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

  async getQuestionsOfTheDay() {
    const allQuestions = await this.prisma.question.findMany({
      select: {
        id: true,
        title: true,
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    // 随机打乱并取前3个
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
}
