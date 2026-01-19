import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateSequenceDto,
} from './dto';

export interface CategoryTree {
  id: string;
  name: string;
  sequence: number;
  parent_id: string | null;
  children: CategoryTree[];
}

@Injectable()
export class AdminCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree(): Promise<CategoryTree[]> {
    const all = await this.prisma.category.findMany({
      orderBy: [{ parent_id: 'asc' }, { sequence: 'asc' }],
    });

    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // 第一遍：建立map
    all.forEach(cat => {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        sequence: cat.sequence,
        parent_id: cat.parent_id,
        children: [],
      });
    });

    // 第二遍：构建tree
    all.forEach(cat => {
      const node = map.get(cat.id)!;
      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  async create(createDto: CreateCategoryDto) {
    const trimmedName = createDto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Category name cannot be empty');
    }

    // 验证parent_id是否存在（如果提供了）
    if (createDto.parent_id) {
      const parent = await this.prisma.category.findUnique({
        where: { id: createDto.parent_id },
      });

      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }

      // 验证parent不能是sub-category（即parent本身不能有parent_id）
      if (parent.parent_id) {
        throw new BadRequestException(
          'Cannot create sub-category under a sub-category',
        );
      }
    }

    // 检查同级别是否已存在同名category
    const existing = await this.prisma.category.findFirst({
      where: {
        name: trimmedName,
        parent_id: createDto.parent_id || null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Category with the same name already exists at this level',
      );
    }

    // 计算sequence：同级别最大sequence + 1
    const maxSequence = await this.prisma.category.findFirst({
      where: {
        parent_id: createDto.parent_id || null,
      },
      orderBy: {
        sequence: 'desc',
      },
      select: {
        sequence: true,
      },
    });

    const sequence = (maxSequence?.sequence ?? 0) + 1;

    return this.prisma.category.create({
      data: {
        name: trimmedName,
        parent_id: createDto.parent_id || null,
        sequence,
      },
    });
  }

  async update(id: string, updateDto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    // 如果更新名字，检查同级别是否已存在同名
    if (updateDto.name && updateDto.name !== existing.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          name: updateDto.name,
          parent_id: existing.parent_id,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          'Category with the same name already exists at this level',
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
      },
    });
  }

  async updateSequence(updateDto: UpdateSequenceDto) {
    // 验证所有ID都存在
    const ids = updateDto.updates.map(u => u.id);
    const existing = await this.prisma.category.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
      },
    });

    if (existing.length !== ids.length) {
      throw new BadRequestException('Some category IDs not found');
    }

    // 使用事务批量更新
    return this.prisma.$transaction(
      updateDto.updates.map(({ id, sequence }) =>
        this.prisma.category.update({
          where: { id },
          data: { sequence },
        }),
      ),
    );
  }

  async delete(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        questions: {
          where: {
            deleted_at: null,
          },
          select: {
            id: true,
          },
        },
        sub_questions: {
          where: {
            deleted_at: null,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    // 检查是否有question关联（作为category或sub_category）
    const questions = (category.questions || []) as Array<{
      id: string;
    }>;
    const subQuestions = (category.sub_questions || []) as Array<{
      id: string;
    }>;
    const questionCount = questions.length + subQuestions.length;

    if (questionCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${questionCount} associated question(s)`,
      );
    }

    // 检查是否有子category
    const childCount = await this.prisma.category.count({
      where: {
        parent_id: id,
      },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete category "${category.name}" because it has ${childCount} sub-category(ies)`,
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
