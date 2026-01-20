import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateQuestionDto,
  UpdateQuestionDto,
  QueryQuestionDto,
} from './dto';

@Injectable()
export class AdminQuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        parent_id: true,
        sequence: true,
      },
      orderBy: [
        {
          sequence: 'asc',
        },
        {
          name: 'asc',
        },
      ],
    });
  }

  async findList(queryDto: QueryQuestionDto) {
    const { page = 1, pageSize = 10, categoryId } = queryDto;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const pageSizeNum =
      typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

    const where = {
      deleted_at: null,
      ...(categoryId && { category_id: categoryId }),
    };

    const total = await this.prisma.question.count({ where });
    const data = await this.prisma.question.findMany({
      where,
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: [
        // {
        //   category: {
        //     sequence: 'asc',
        //   },
        // },
        {
          sequence: 'asc',
        },
      ],
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sub_category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      data,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };
  }

  async findOne(id: string) {
    const question = await this.prisma.question.findFirst({
      where: { id, deleted_at: null },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sub_category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question;
  }

  async create(createDto: CreateQuestionDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: createDto.category_id },
      select: { id: true },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    // 验证 sub_category_id 必须是所选 category_id 的子分类
    const subCategory = await this.prisma.category.findUnique({
      where: { id: createDto.sub_category_id },
      select: { id: true, parent_id: true },
    });

    if (!subCategory) {
      throw new BadRequestException('Sub-category not found');
    }

    if (subCategory.parent_id !== createDto.category_id) {
      throw new BadRequestException(
        'Sub-category must be a child of the selected category',
      );
    }

    // 自动生成 sequence：查找同 category 下现有问题的最大 sequence + 1
    const maxSequence = await this.prisma.question.aggregate({
      where: {
        category_id: createDto.category_id,
        deleted_at: null,
      },
      _max: {
        sequence: true,
      },
    });

    const sequence = (maxSequence._max.sequence ?? 0) + 1;

    return this.prisma.question.create({
      data: {
        title: createDto.title,
        category_id: createDto.category_id,
        sub_category_id: createDto.sub_category_id,
        sequence,
        cluster: createDto.cluster ?? null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sub_category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, updateDto: UpdateQuestionDto) {
    const existing = await this.prisma.question.findUnique({
      where: { id },
      select: { id: true, category_id: true },
    });

    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    // 确定要使用的 category_id（如果更新了就用新的，否则用现有的）
    const categoryId = updateDto.category_id ?? existing.category_id;

    if (updateDto.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.category_id },
        select: { id: true },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    // 如果提供了 sub_category_id，验证它必须是所选 category_id 的子分类
    if (updateDto.sub_category_id !== undefined) {
      const subCategory = await this.prisma.category.findUnique({
        where: { id: updateDto.sub_category_id },
        select: { id: true, parent_id: true },
      });

      if (!subCategory) {
        throw new BadRequestException('Sub-category not found');
      }

      if (subCategory.parent_id !== categoryId) {
        throw new BadRequestException(
          'Sub-category must be a child of the selected category',
        );
      }
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(updateDto.title !== undefined && { title: updateDto.title }),
        ...(updateDto.category_id !== undefined && {
          category_id: updateDto.category_id,
        }),
        ...(updateDto.sub_category_id !== undefined && {
          sub_category_id: updateDto.sub_category_id,
        }),
        ...(updateDto.cluster !== undefined && { cluster: updateDto.cluster }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sub_category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.question.findFirst({
      where: { id, deleted_at: null },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    const answerCount = await this.prisma.answer.count({
      where: { question_id: id },
    });

    if (answerCount > 0) {
      throw new BadRequestException(
        'Question has answers and cannot be deleted',
      );
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        sub_category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }
}
