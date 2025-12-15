import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryReflectionDto } from './dto';
import { IconService } from '../onboard/icon.service';

@Injectable()
export class AdminReflectionService {
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
}
