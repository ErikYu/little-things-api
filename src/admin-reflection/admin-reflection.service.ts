import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReflectionDto } from './dto';
import { IconService } from '../onboard/icon.service';

@Injectable()
export class AdminReflectionService {
  private readonly logger = new Logger(AdminReflectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly iconService: IconService,
  ) {}

  async findList(queryDto: QueryReflectionDto) {
    const { page = 1, pageSize = 10 } = queryDto;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const pageSizeNum =
      typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

    // 查询总数
    const total = await this.prisma.answer.count();

    // 查询列表
    const data = await this.prisma.answer.findMany({
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            apple_id: true,
          },
        },
        icon: {
          select: {
            id: true,
            url: true,
            status: true,
          },
        },
        question: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // 为 icon.url 生成签名
    const enrichedData = data.map(item => {
      if (item.icon && item.icon.url) {
        return {
          ...item,
          icon: {
            ...item.icon,
            url: this.iconService.getSignedUrl(item.icon.url) || '',
          },
        };
      }
      return item;
    });

    return {
      data: enrichedData,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };
  }

  async regenerateIcon(answerId: string) {
    // 查找答案及其icon
    const answer = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        icon: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    let iconId: string;

    // 如果icon不存在，创建一个新的
    if (!answer.icon) {
      const newIcon = await this.prisma.answerIcon.create({
        data: {
          answer_id: answerId,
          status: 'PENDING',
          url: '',
        },
      });
      iconId = newIcon.id;
      this.logger.log(`Created new icon for answer ${answerId}: ${iconId}`);
    } else {
      // 如果icon存在，重置状态为PENDING
      iconId = answer.icon.id;
      await this.prisma.answerIcon.update({
        where: { id: iconId },
        data: {
          status: 'PENDING',
          error: null,
          url: '',
        },
      });
      this.logger.log(`Reset icon status for answer ${answerId}: ${iconId}`);
    }

    // 异步执行生成，不等待完成
    this.iconService
      .generateIcon(iconId, answer.content)
      .then(() => {
        this.logger.log(`Icon generation completed for answer ${answerId}`);
      })
      .catch(err => {
        this.logger.error(
          `Failed to generate icon for answer ${answerId}: ${err.message}`,
        );
      });

    return {
      success: true,
      message: 'Icon regeneration started',
      iconId,
    };
  }
}
