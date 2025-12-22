import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { IconService } from 'src/onboard/icon.service';

@Injectable()
export class IconRetryScheduler implements OnModuleInit {
  private readonly logger = new Logger(IconRetryScheduler.name);
  private isProcessing = false; // 执行锁，防止并发执行
  private retryingIconIds = new Set<string>(); // 正在重试的 icon ID 集合

  onModuleInit() {
    // this.handleFailedIcons();
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly iconService: IconService,
  ) {}

  // 获取正在重试的 icon ID 列表
  getRetryingIconIds(): string[] {
    return Array.from(this.retryingIconIds);
  }

  @Cron('*/15 * * * *') // 每15分钟执行一次
  async handleFailedIcons() {
    // 如果上一次任务还在执行，跳过本次执行
    if (this.isProcessing) {
      this.logger.warn(
        'Previous retry task is still running, skipping this execution.',
      );
      return;
    }

    this.isProcessing = true;
    this.logger.log('Starting to check for failed icons...');

    try {
      // 查询所有状态为 FAILED 且 bypass 为 false 的 icon，并获取对应的 answer content
      const failedIcons = await this.prisma.answerIcon.findMany({
        where: {
          status: 'FAILED',
          bypass: false, // 过滤掉 bypass 为 true 的 icon
        },
        include: {
          answer: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      });

      if (failedIcons.length === 0) {
        this.logger.log('No failed icons found.');
        return; // finally 块会释放锁
      }

      this.logger.log(`Found ${failedIcons.length} failed icon(s) to retry.`);

      // 为每个失败的 icon 重新执行生成
      for (const icon of failedIcons) {
        try {
          // 再次检查状态，确保仍然是 FAILED（可能在查询后被其他地方修改了）
          const currentIcon = await this.prisma.answerIcon.findUnique({
            where: { id: icon.id },
            select: { status: true },
          });

          if (!currentIcon || currentIcon.status !== 'FAILED') {
            this.logger.log(
              `Icon ${icon.id} status is no longer FAILED (current: ${currentIcon?.status || 'not found'}), skipping.`,
            );
            continue;
          }

          // 将状态重置为 PENDING
          await this.prisma.answerIcon.update({
            where: { id: icon.id },
            data: {
              status: 'PENDING',
              error: null,
            },
          });

          // 标记为正在重试
          this.retryingIconIds.add(icon.id);

          // 重新执行生成
          this.logger.log(
            `Retrying icon generation for iconId: ${icon.id}, answerId: ${icon.answer_id}`,
          );

          try {
            await this.iconService.generateIcon(
              icon.id,
              icon.answer.content,
              true,
            );
          } finally {
            // 生成完成后（无论成功或失败）移除重试标记
            this.retryingIconIds.delete(icon.id);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Failed to retry icon generation for iconId: ${icon.id}. Error: ${errorMessage}`,
          );
        }
      }

      this.logger.log(
        `Completed retry process for ${failedIcons.length} icon(s).`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error in handleFailedIcons scheduler: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    } finally {
      // 无论成功或失败，都要释放锁
      this.isProcessing = false;
    }
  }
}
