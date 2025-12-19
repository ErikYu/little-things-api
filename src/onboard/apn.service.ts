import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider, Notification } from 'apn';
import { PrismaService } from 'src/prisma/prisma.service';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface PushNotificationPayload {
  title?: string;
  subtitle?: string;
  body: string;
  topic?: string;
}

@Injectable()
export class ApnService {
  private readonly logger = new Logger(ApnService.name);
  private apnProvider: Provider | null = null;
  private bundleId: string;
  private keyPath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initializeProvider();
  }

  /**
   * 初始化 APN Provider
   */
  private initializeProvider() {
    try {
      const keyId = this.configService.get<string>('APN_KEY_ID');
      const teamId = this.configService.get<string>('APN_TEAM_ID');
      this.bundleId = this.configService.get<string>('APN_BUNDLE_ID')!;
      this.keyPath = this.configService.get<string>('APN_KEY_PATH')!;
      const production = true;
      if (!keyId || !teamId || !this.bundleId || !this.keyPath) {
        this.logger.error(
          'APN configuration is incomplete. Push notifications will be disabled.',
        );
        return;
      }

      // 读取 P8 密钥文件
      let keyData: Buffer | string;
      try {
        // 如果 keyPath 是绝对路径，直接使用；否则相对于项目根目录
        const fullKeyPath = this.keyPath.startsWith('/')
          ? this.keyPath
          : join(process.cwd(), this.keyPath);
        keyData = readFileSync(fullKeyPath);
        this.logger.log(`Loaded APN key from: ${fullKeyPath}`);
      } catch (fileError) {
        this.logger.error(
          `Failed to read APN key file from ${this.keyPath}`,
          fileError,
        );
        this.apnProvider = null;
        return;
      }

      const options = {
        token: {
          key: keyData,
          keyId: keyId,
          teamId: teamId,
        },
        production: production,
      };

      this.apnProvider = new Provider(options);
      this.logger.log(
        `APN Provider initialized (${production ? 'Production' : 'Development'})`,
      );
    } catch (error) {
      this.logger.error('Failed to initialize APN Provider', error);
      this.apnProvider = null;
    }
  }

  /**
   * 发送推送通知到指定用户
   * @param userId 用户 ID
   * @param payload 通知内容
   * @returns 是否发送成功
   */
  async sendNotificationToUser(
    userId: string,
    payload: PushNotificationPayload,
  ): Promise<boolean> {
    const customTopic = payload?.topic;

    // 创建通知记录（PENDING 状态）
    let historyId: string;
    let deviceToken: string;

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { device_token: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        // 创建失败记录
        await this.prisma.aPNHistory.create({
          data: {
            user_id: userId,
            device_token: '',
            title: payload.title,
            subtitle: payload.subtitle,
            body: payload.body,
            topic: customTopic || null,
            status: 'FAILED',
            error: 'User not found',
          },
        });
        return false;
      }

      if (!user.device_token) {
        this.logger.warn(`User ${userId} does not have a device token`);
        // 创建失败记录
        await this.prisma.aPNHistory.create({
          data: {
            user_id: userId,
            device_token: '',
            title: payload.title,
            subtitle: payload.subtitle,
            body: payload.body,
            topic: customTopic || null,
            status: 'FAILED',
            error: 'User does not have a device token',
          },
        });
        return false;
      }

      deviceToken = user.device_token;

      // 创建 PENDING 记录
      const history = await this.prisma.aPNHistory.create({
        data: {
          user_id: userId,
          device_token: deviceToken,
          title: payload.title,
          subtitle: payload.subtitle,
          body: payload.body,
          topic: customTopic || null,
          status: 'PENDING',
        },
      });
      historyId = history.id;
    } catch (error) {
      this.logger.error(`Failed to create APN history record`, error);
      return false;
    }

    if (!this.apnProvider) {
      this.logger.error('APN Provider is not initialized');
      // 更新记录为失败
      await this.prisma.aPNHistory.update({
        where: { id: historyId },
        data: {
          status: 'FAILED',
          error: 'APN Provider is not initialized',
        },
      });
      return false;
    }

    try {
      // 创建通知对象
      const notification = new Notification();

      // 设置 alert（支持 title, subtitle, body）
      if (payload.title || payload.subtitle) {
        const alert: { title?: string; subtitle?: string; body: string } = {
          body: payload.body,
        };
        if (payload.title) {
          alert.title = payload.title;
        }
        if (payload.subtitle) {
          alert.subtitle = payload.subtitle;
        }
        notification.alert = alert;
      } else {
        notification.alert = payload.body;
      }

      // 设置 topic（永远是 bundleId）
      notification.topic = this.bundleId;

      // 如果有自定义 topic，将其添加到 payload 中
      if (customTopic) {
        notification.payload = {
          ...notification.payload,
          custom: {
            topic: customTopic,
          },
        };
      }

      // 设置优先级和过期时间
      notification.priority = 10; // 高优先级
      notification.expiry = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期

      console.log(notification);

      const result = await this.apnProvider.send(notification, deviceToken);

      console.log(result.failed);

      // 检查是否有失败的发送
      if (result.failed && result.failed.length > 0) {
        const errorReasons: string[] = [];
        result.failed.forEach(failure => {
          if (failure.response?.reason) {
            errorReasons.push(failure.response.reason);
          }
          this.logger.error(
            `Failed to send notification to user ${userId}, ${failure.response?.reason}`,
          );
        });

        // 更新记录为失败
        await this.prisma.aPNHistory.update({
          where: { id: historyId },
          data: {
            status: 'FAILED',
            error: errorReasons.join('; '),
          },
        });
        return false;
      }

      // 更新记录为成功
      await this.prisma.aPNHistory.update({
        where: { id: historyId },
        data: {
          status: 'SENT',
        },
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}`, error);
      // 更新记录为失败
      try {
        await this.prisma.aPNHistory.update({
          where: { id: historyId },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      } catch (err) {
        this.logger.error(`Failed to update APN history record`, err);
      }
      return false;
    }
  }
}
