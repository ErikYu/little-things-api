import { Injectable } from '@nestjs/common';
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
}

