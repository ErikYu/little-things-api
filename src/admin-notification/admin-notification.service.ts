import { Injectable, Logger } from '@nestjs/common';
import { ApnService, PushNotificationPayload } from '../onboard/apn.service';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './dto';

@Injectable()
export class AdminNotificationService {
  private readonly logger = new Logger(AdminNotificationService.name);

  constructor(
    private readonly apnService: ApnService,
    private readonly prisma: PrismaService,
  ) {}

  async sendNotification(dto: SendNotificationDto) {
    const payload: PushNotificationPayload = {
      title: dto.title,
      subtitle: dto.subtitle,
      body: dto.body,
      topic: dto.topic,
    };

    const success = await this.apnService.sendNotificationToUser(
      dto.userId,
      payload,
    );

    if (!success) {
      throw new Error(
        'Failed to send notification. Please check: user device token exists, APN configuration is correct, and device token is valid.',
      );
    }

    return {
      success: true,
      message: 'Notification sent successfully',
    };
  }

  async getHistory(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [total, histories] = await Promise.all([
      this.prisma.aPNHistory.count(),
      this.prisma.aPNHistory.findMany({
        skip,
        take: pageSize,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              apple_id: true,
            },
          },
        },
      }),
    ]);

    return {
      data: histories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
