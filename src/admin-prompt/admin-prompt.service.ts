import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, PromptCategory } from '@prisma/client';
import type { CreatePromptDto, UpdatePromptDto, QueryPromptDto } from './dto';

const PLACEHOLDER = '[INSERT_USER_REFLECTION_HERE]';

@Injectable()
export class AdminPromptService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreatePromptDto) {
    if (
      createDto.category === PromptCategory.ICON_GENERATION &&
      !createDto.content.includes(PLACEHOLDER)
    ) {
      throw new BadRequestException(
        `Content must contain placeholder: ${PLACEHOLDER}`,
      );
    }

    return await this.prisma.prompt.create({
      data: {
        category: createDto.category,
        content: createDto.content,
        active: createDto.active,
      },
    });
  }

  async update(id: string, updateDto: UpdatePromptDto) {
    // 检查是否存在且未删除
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (
      prompt.category === PromptCategory.ICON_GENERATION &&
      updateDto.content &&
      !updateDto.content.includes(PLACEHOLDER)
    ) {
      throw new BadRequestException(
        `Content must contain placeholder: ${PLACEHOLDER}`,
      );
    }

    return await this.prisma.prompt.update({
      where: { id },
      data: {
        ...(updateDto.content !== undefined && { content: updateDto.content }),
        ...(updateDto.active !== undefined && { active: updateDto.active }),
      },
    });
  }

  async delete(id: string) {
    // 检查是否存在且未删除
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return await this.prisma.prompt.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  async findList(queryDto: QueryPromptDto) {
    const { category, content, active, page = 1, pageSize = 10 } = queryDto;
    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const pageSizeNum =
      typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;

    // 构建查询条件
    const where: Prisma.PromptWhereInput = {
      deleted_at: null, // 只查询未删除的
    };

    if (category) {
      where.category = category;
    }

    if (content) {
      where.content = {
        contains: content,
        mode: 'insensitive',
      };
    }

    if (active !== undefined) {
      where.active = active;
    }

    // 查询总数
    const total = await this.prisma.prompt.count({ where });

    // 查询列表
    const prompts = await this.prisma.prompt.findMany({
      where,
      skip: (pageNum - 1) * pageSizeNum,
      take: pageSizeNum,
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      data: prompts,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };
  }

  async findOne(id: string) {
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }
}
