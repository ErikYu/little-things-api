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

    return this.prisma.question.create({
      data: {
        title: createDto.title,
        category_id: createDto.category_id,
        sequence: createDto.sequence,
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
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Question not found');
    }

    if (updateDto.category_id) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateDto.category_id },
        select: { id: true },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    return this.prisma.question.update({
      where: { id },
      data: {
        ...(updateDto.title !== undefined && { title: updateDto.title }),
        ...(updateDto.category_id !== undefined && {
          category_id: updateDto.category_id,
        }),
        ...(updateDto.sequence !== undefined && {
          sequence: updateDto.sequence,
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
    const existing = await this.prisma.question.findUnique({
      where: { id },
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

    return this.prisma.question.delete({
      where: { id },
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
