import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import dayjs from 'dayjs';
import { IconService } from './icon.service';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class OnboardService {
  logger = new Logger(OnboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private iconService: IconService,
  ) {}
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

    // 获取所有分类和问题（只获取第一层category）
    const categories = await this.prisma.category.findMany({
      where: {
        parent_id: null,
      },
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
      deleted_at: null;
      sequence?: { lt: number };
    } = {
      user_id: userId,
      question_id: questionId,
      deleted_at: null,
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
        icon: {
          select: {
            id: true,
            url: true,
            status: true,
          },
        },
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
          deleted_at: null,
        },
      }),
      this.prisma.answer.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
          deleted_at: null,
        },
        select: { created_at: true, created_ymd: true },
        orderBy: { sequence: 'asc' },
      }),
      this.prisma.answer.findFirst({
        where: {
          user_id: userId,
          question_id: questionId,
          deleted_at: null,
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
        icon: answer.icon
          ? {
              ...answer.icon,
              url:
                answer.icon.status === 'GENERATED' && answer.icon.url
                  ? this.iconService.getSignedUrl(answer.icon.url)
                  : answer.icon.url,
            }
          : null,
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
        icon: {
          create: {
            status: 'PENDING',
            url: '',
          },
        },
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
        icon: {
          select: { id: true, status: true },
        },
      },
    });

    if (answer && answer.icon && answer.icon.id) {
      // 创建回答之后，调用llm创建一个icon
      this.iconService
        .generateIcon(answer.icon.id, answer.content, true)
        .then(() => {})
        .catch(err => {
          this.logger.error(err);
        });
    }

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
        deleted_at: null,
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
        icon: {
          select: {
            id: true,
            url: true,
            status: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });

    // 按日期分组所有回答
    const dailyAnswers = new Map<string, typeof answers>();

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
          question: answer.question,
          content: answer.content,
          created_ymd: answer.created_ymd,
          icon: answer.icon
            ? {
                ...answer.icon,
                url:
                  answer.icon.status === 'GENERATED' && answer.icon.url
                    ? this.iconService.getSignedUrl(answer.icon.url)
                    : answer.icon.url,
              }
            : null,
        })),
      });
    });

    return result;
  }

  async getThreadView(userId: string) {
    // 1. 一次性获取所有答案（包含问题和 icon 信息）
    const allAnswers = await this.prisma.answer.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      select: {
        id: true,
        content: true,
        created_ymd: true,
        created_at: true,
        question_id: true,
        question: {
          select: {
            id: true,
            title: true,
          },
        },
        icon: {
          select: {
            id: true,
            url: true,
            status: true,
            created_at: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (allAnswers.length === 0) {
      return [];
    }

    // 2. 获取 pin 状态
    const pinnedQuestions = await this.prisma.questionUserPinned.findMany({
      where: { user_id: userId },
      select: { question_id: true },
    });

    const pinnedQuestionIds = new Set(pinnedQuestions.map(p => p.question_id));

    // 3. 在内存中按 question_id 分组答案，并计算每个问题的最新回答时间
    const questionMap = new Map<
      string,
      {
        id: string;
        title: string;
        pinned: boolean;
        latestAnswerTime: Date;
        answers: Array<{
          id: string;
          content: string;
          created_ymd: string;
          created_at: Date;
          icon: {
            id: string;
            url: string;
            status: string;
            created_at: Date;
          } | null;
        }>;
      }
    >();

    allAnswers.forEach(answer => {
      const questionId = answer.question_id;
      const question = answer.question;

      if (!questionMap.has(questionId)) {
        questionMap.set(questionId, {
          id: question.id,
          title: question.title,
          pinned: pinnedQuestionIds.has(questionId),
          latestAnswerTime: answer.created_at,
          answers: [],
        });
      }

      const questionData = questionMap.get(questionId)!;
      questionData.answers.push({
        id: answer.id,
        content: answer.content,
        created_ymd: answer.created_ymd,
        created_at: answer.created_at,
        icon: answer.icon
          ? {
              id: answer.icon.id,
              url: answer.icon.url,
              status: answer.icon.status,
              created_at: answer.icon.created_at,
            }
          : null,
      });

      // 更新最新回答时间
      if (answer.created_at > questionData.latestAnswerTime) {
        questionData.latestAnswerTime = answer.created_at;
      }
    });

    // 4. 问题排序：先按 pinned 状态（pinned 在前），再按最新回答时间（最新的在前）
    const sortedQuestions = Array.from(questionMap.values()).sort((a, b) => {
      // 先按 pinned 状态排序
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      // 相同 pinned 状态下，按最新回答时间排序
      return b.latestAnswerTime.getTime() - a.latestAnswerTime.getTime();
    });

    // 5. 对每个问题的答案进行排序：按 icon 创建时间排序（最新的在前）
    sortedQuestions.forEach(question => {
      question.answers.sort((a, b) => {
        const aIconTime = a.icon?.created_at;
        const bIconTime = b.icon?.created_at;

        // 如果都有 icon，按 icon 创建时间排序（最新的在前）
        if (aIconTime && bIconTime) {
          return bIconTime.getTime() - aIconTime.getTime();
        }

        // 如果只有 a 有 icon，a 在前
        if (aIconTime && !bIconTime) return -1;

        // 如果只有 b 有 icon，b 在前
        if (!aIconTime && bIconTime) return 1;

        // 如果都没有 icon，按答案创建时间排序（最新的在前）
        return b.created_at.getTime() - a.created_at.getTime();
      });
    });

    // 6. 处理 icon URL 签名并返回结果
    return sortedQuestions.map(question => ({
      id: question.id,
      title: question.title,
      pinned: question.pinned,
      answers: question.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        created_ymd: answer.created_ymd,
        icon: answer.icon
          ? {
              id: answer.icon.id,
              url:
                answer.icon.status === 'GENERATED' && answer.icon.url
                  ? this.iconService.getSignedUrl(answer.icon.url)
                  : answer.icon.url,
              status: answer.icon.status,
            }
          : null,
      })),
    }));
  }

  /**
   * 简单的字符串hash函数
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 基于seed的Fisher-Yates洗牌算法
   */
  private seededShuffle<T>(array: T[], seed: string): T[] {
    const shuffled = [...array];
    let hash = this.hashString(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
      // 生成伪随机数
      hash = (hash * 9301 + 49297) % 233280;
      const j = Math.floor((hash / 233280) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  async getQuestionsOfTheDay(userId: string) {
    // 1. 先获取 QuestionOfTheDay 表中的问题（按 sequence 排序）
    const fixedQoDQuestions = await this.prisma.questionOfTheDay.findMany({
      orderBy: {
        sequence: 'asc',
      },
      include: {
        question: {
          select: {
            id: true,
            title: true,
            category_id: true,
            sub_category_id: true,
            cluster: true,
            deleted_at: true,
            category: {
              select: {
                name: true,
              },
            },
            sub_category: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // 过滤掉已删除的问题
    const validFixedQuestions = fixedQoDQuestions
      .filter(item => item.question.deleted_at === null)
      .map(item => item.question);

    // 2. 计算还需要随机选择的数量
    const fixedCount = validFixedQuestions.length;
    const remainingCount = 3 - fixedCount;

    // 如果已经够3个问题了，直接返回
    if (remainingCount === 0) {
      return validFixedQuestions.map(q => ({
        id: q.id,
        title: q.title,
        category: {
          name: (q.category as { name: string })?.name ?? '',
        },
      }));
    }

    // 3. 获取用户pinned的问题ID
    const pinnedQuestions = await this.prisma.questionUserPinned.findMany({
      where: { user_id: userId },
      select: { question_id: true },
    });

    const pinnedQuestionIds = new Set(pinnedQuestions.map(p => p.question_id));

    // 4. 获取已固定问题的ID集合，用于排除
    const fixedQuestionIds = new Set(validFixedQuestions.map(q => q.id));

    // 5. 获取所有未删除的问题，排除已固定和已pinned的问题
    const allQuestions = await this.prisma.question.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        title: true,
        category_id: true,
        sub_category_id: true,
        cluster: true,
        category: {
          select: {
            name: true,
          },
        },
        sub_category: {
          select: {
            name: true,
          },
        },
      },
    });

    // 过滤掉已固定和已pinned的问题
    const candidateQuestions = allQuestions.filter(
      q => !fixedQuestionIds.has(q.id) && !pinnedQuestionIds.has(q.id),
    );

    // 6. 如果还需要随机选择问题
    const selectedQuestions: typeof allQuestions = [...validFixedQuestions];
    const usedCategories = new Set<string>();
    const usedSubCategories = new Set<string | null>();
    const usedClusters = new Set<string | null>();

    // 记录已固定问题使用的维度
    validFixedQuestions.forEach(q => {
      usedCategories.add(q.category_id);
      usedSubCategories.add(q.sub_category_id ?? null);
      usedClusters.add(q.cluster ?? null);
    });

    if (remainingCount > 0 && candidateQuestions.length > 0) {
      // 使用确定性随机排序（基于userId和今天的日期）
      const today = dayjs().format('YYYY-MM-DD');
      const seed = `${userId}_${today}`;
      const shuffledQuestions = this.seededShuffle(candidateQuestions, seed);

      // 三维度去重选择：确保category、sub_category、cluster都不重复
      for (const question of shuffledQuestions) {
        // 如果已经选够3个，退出循环
        if (selectedQuestions.length >= 3) {
          break;
        }

        // 检查三个维度是否都未被使用
        const categoryUsed = usedCategories.has(question.category_id);
        const subCategoryUsed = usedSubCategories.has(
          question.sub_category_id ?? null,
        );
        const clusterUsed = usedClusters.has(question.cluster ?? null);

        // 只有三个维度都未被使用，才加入结果
        if (!categoryUsed && !subCategoryUsed && !clusterUsed) {
          selectedQuestions.push(question);
          usedCategories.add(question.category_id);
          usedSubCategories.add(question.sub_category_id ?? null);
          usedClusters.add(question.cluster ?? null);
        }
      }
    }

    // 7. 返回结果，格式化为API响应格式（保持原有接口格式）
    return selectedQuestions.map(q => ({
      id: q.id,
      title: q.title,
      category: {
        name: (q.category as { name: string })?.name ?? '',
      },
    }));
  }

  async saveDeviceToken(userId: string, deviceToken: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { device_token: deviceToken },
    });
    return { device_token: deviceToken };
  }

  async deleteAnswer(userId: string, answerId: string) {
    // 查找回答，确保存在且未删除
    const answer = await this.prisma.answer.findFirst({
      where: {
        id: answerId,
        deleted_at: null,
      },
      select: {
        id: true,
        user_id: true,
        content: true,
        created_ymd: true,
        created_tms: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    // 验证回答是否属于当前用户
    if (answer.user_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this answer',
      );
    }

    // 执行软删除
    const deletedAnswer = await this.prisma.answer.update({
      where: { id: answerId },
      data: {
        deleted_at: new Date(),
      },
      select: {
        id: true,
        content: true,
        created_ymd: true,
        created_tms: true,
      },
    });

    return deletedAnswer;
  }
}
