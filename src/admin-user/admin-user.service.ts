import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async findList(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [total, users] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          email: true,
          apple_id: true,
          created_at: true,
          last_login_at: true,
          device_token: true,
          _count: {
            select: { answers: true },
          },
        },
      }),
    ]);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findUsersWithDeviceToken() {
    const users = await this.prisma.user.findMany({
      where: {
        device_token: {
          not: null,
        },
      },
      select: {
        id: true,
        email: true,
        apple_id: true,
        device_token: true,
        created_at: true,
        last_login_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: users,
      total: users.length,
    };
  }

  async updateDeviceToken(userId: string, deviceToken: string) {
    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // 更新 device_token
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { device_token: deviceToken },
      select: {
        id: true,
        email: true,
        apple_id: true,
        device_token: true,
        created_at: true,
        last_login_at: true,
      },
    });

    return updatedUser;
  }
}
