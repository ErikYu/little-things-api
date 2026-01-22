import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpdateFeatureFlagDto } from './dto';

@Injectable()
export class AdminFeatureFlagService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.featureFlag.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async update(id: string, updateDto: UpdateFeatureFlagDto) {
    // 检查是否存在
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      throw new NotFoundException('Feature flag not found');
    }

    // 更新 enabled 状态
    return await this.prisma.featureFlag.update({
      where: { id },
      data: {
        enabled: updateDto.enabled,
      },
    });
  }
}
