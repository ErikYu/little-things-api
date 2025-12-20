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

    // 使用事务创建 prompt 和初始版本
    return await this.prisma.$transaction(async tx => {
      // 1. 创建 prompt
      const prompt = await tx.prompt.create({
      data: {
        category: createDto.category,
        content: createDto.content,
        active: createDto.active,
      },
      });

      // 2. 创建初始版本（version 1）
      const version = await tx.promptVersion.create({
        data: {
          prompt_id: prompt.id,
          version: 1,
          content: createDto.content,
          change_note: createDto.change_note || 'Initial version',
        },
      });

      // 3. 关联当前版本
      return await tx.prompt.update({
        where: { id: prompt.id },
        data: {
          current_version_id: version.id,
        },
        include: {
          current_version: true,
        },
      });
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

    // 判断内容是否有变化
    const contentChanged =
      updateDto.content !== undefined && updateDto.content !== prompt.content;

    // 如果内容有变化，需要创建新版本
    if (contentChanged) {
      return await this.prisma.$transaction(async tx => {
        // 1. 获取当前最大版本号
        const maxVersion = await tx.promptVersion.findFirst({
          where: { prompt_id: id },
          orderBy: { version: 'desc' },
        });

        const nextVersion = (maxVersion?.version || 0) + 1;

        // 2. 创建新版本
        const newVersion = await tx.promptVersion.create({
          data: {
            prompt_id: id,
            version: nextVersion,
            content: updateDto.content!,
            change_note: updateDto.change_note || null,
          },
        });

        // 3. 更新 prompt 主表（包括内容和当前版本关联）
        return await tx.prompt.update({
          where: { id },
          data: {
            content: updateDto.content,
            ...(updateDto.active !== undefined && { active: updateDto.active }),
            current_version_id: newVersion.id,
          },
          include: {
            current_version: true,
          },
        });
      });
    } else {
      // 如果内容没有变化，只更新 active 状态
    return await this.prisma.prompt.update({
      where: { id },
      data: {
        ...(updateDto.active !== undefined && { active: updateDto.active }),
      },
        include: {
          current_version: true,
        },
    });
    }
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
      include: {
        _count: {
          select: {
            versions: true,
          },
        },
      },
    });

    // 格式化数据，添加版本数量
    const promptsWithVersionCount = prompts.map(prompt => ({
      ...prompt,
      versionCount: prompt._count.versions,
      current_version_id: prompt.current_version_id,
    }));

    return {
      data: promptsWithVersionCount,
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
      select: {
        id: true,
        category: true,
        content: true,
        active: true,
        created_at: true,
        updated_at: true,
        current_version_id: true,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }

  async getVersions(promptId: string) {
    // 检查 prompt 是否存在
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id: promptId,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // 获取所有版本，按时间倒序
    const versions = await this.prisma.promptVersion.findMany({
      where: {
        prompt_id: promptId,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return versions;
  }

  async applyVersion(promptId: string, versionId: string) {
    // 检查 prompt 是否存在
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id: promptId,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // 检查版本是否存在
    const version = await this.prisma.promptVersion.findFirst({
      where: {
        id: versionId,
        prompt_id: promptId,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // 如果版本内容与当前内容相同，不需要更新
    if (version.content === prompt.content) {
      throw new BadRequestException(
        'Version content is the same as current content',
      );
    }

    // 验证内容（如果是 ICON_GENERATION 类型）
    if (
      prompt.category === PromptCategory.ICON_GENERATION &&
      !version.content.includes(PLACEHOLDER)
    ) {
      throw new BadRequestException(
        `Version content must contain placeholder: ${PLACEHOLDER}`,
      );
    }

    // 直接回退到旧版本，不创建新版本记录
    return await this.prisma.prompt.update({
      where: { id: promptId },
      data: {
        content: version.content,
        current_version_id: versionId,
      },
      include: {
        current_version: true,
      },
    });
  }

  async deleteVersion(promptId: string, versionId: string) {
    // 检查 prompt 是否存在
    const prompt = await this.prisma.prompt.findFirst({
      where: {
        id: promptId,
        deleted_at: null,
      },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // 检查版本是否存在
    const version = await this.prisma.promptVersion.findFirst({
      where: {
        id: versionId,
        prompt_id: promptId,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    // 如果删除的是当前版本，需要处理
    if (prompt.current_version_id === versionId) {
      // 找到其他版本作为新的当前版本
      const otherVersion = await this.prisma.promptVersion.findFirst({
        where: {
          prompt_id: promptId,
          id: { not: versionId },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // 使用事务删除版本并更新当前版本
      return await this.prisma.$transaction(async tx => {
        // 删除版本
        await tx.promptVersion.delete({
          where: { id: versionId },
        });

        // 如果有其他版本，更新当前版本关联和内容
        if (otherVersion) {
          return await tx.prompt.update({
            where: { id: promptId },
            data: {
              current_version_id: otherVersion.id,
              content: otherVersion.content,
            },
            include: {
              current_version: true,
            },
          });
        } else {
          // 如果没有其他版本，清空当前版本关联
          return await tx.prompt.update({
            where: { id: promptId },
            data: {
              current_version_id: null,
            },
            include: {
              current_version: true,
            },
          });
        }
      });
    } else {
      // 如果不是当前版本，直接删除
      await this.prisma.promptVersion.delete({
        where: { id: versionId },
      });
      return { success: true };
    }
  }
}
