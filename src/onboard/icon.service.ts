import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import OSS from 'ali-oss';
import {
  BehaviorSubject,
  filter,
  from,
  interval,
  map,
  merge,
  Observable,
  switchMap,
  take,
  takeWhile,
} from 'rxjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { APIConnectionTimeoutError } from 'openai';
import type { ImagesResponse } from 'openai/resources/images';
import { PromptCategory } from '@prisma/client';

const DEFAULT_PROMPT = `The Single-Layer System Prompt
Task: Create a cute, minimalist single vector icon based on the following user text: "[INSERT_USER_REFLECTION_HERE]"

CORE INSTRUCTION (INTERNAL LOGIC): Read the user text and identify the single most concrete, positive object mentioned. Ignore any context, emotions, or background scenery. Draw ONLY that one object.

STRICT VISUAL RULES:

Subject: Exactly ONE core object only. No secondary elements, no contextual symbols, no background details. (e.g., If text says "walking in rain", draw ONE umbrella or ONE boot, not a scene).

Style: Japanese Zakka doodle style. Cozy and hand-drawn feel.

Line Work: Black stroke only. Use a bold, consistent monoline stroke (simulating a 2.3px marker weight). Lines must have slight organic randomness/wobble to look handmade, not mechanical.

Coloring: Monochrome Black & White only. Solid black lines on a solid white background. NO gray, NO shading, NO gradients.

Composition: The object must be small and perfectly centered in the middle of the canvas with ample white negative space around it.

Prohibitions: Absolutely NO TEXT, no letters, no signature.`;

@Injectable()
export class IconService {
  logger = new Logger(IconService.name);

  // SSE进度通知流
  private progressSubject = new BehaviorSubject({
    iconId: '',
    status: '',
    url: '',
  });

  private ossClient: OSS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // 初始化OSS客户端
    const region = this.configService.get<string>('OSS_REGION') || '';
    const accessKeyId =
      this.configService.get<string>('OSS_ACCESS_KEY_ID') || '';
    const accessKeySecret =
      this.configService.get<string>('OSS_ACCESS_KEY_SECRET') || '';
    const bucket = this.configService.get<string>('OSS_BUCKET') || '';

    this.ossClient = new OSS({
      region,
      accessKeyId,
      accessKeySecret,
      secure: true,
      bucket,
    });
  }

  private async getPrompt(): Promise<string> {
    try {
      const dbPrompt = await this.prisma.prompt.findFirst({
        where: {
          category: PromptCategory.ICON_GENERATION,
          active: true,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });

      if (dbPrompt) {
        this.logger.log(`Using prompt from DB: ${dbPrompt.id}`);
        return dbPrompt.content;
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch prompt from DB, using default. Error: ${error}`,
      );
    }

    return DEFAULT_PROMPT;
  }

  async generateIcon(iconId: string, reflection: string) {
    const llm = new OpenAI({
      baseURL: 'https://api.tu-zi.com/v1',
    });
    const promptTemplate = await this.getPrompt();
    const _prompt = promptTemplate.replace(
      '[INSERT_USER_REFLECTION_HERE]',
      reflection,
    );
    this.logger.log(`Icon[${iconId}]: Starting to generate icon`);

    let response: ImagesResponse | undefined;
    let lastError: Error | null = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        response = await llm.images.generate({
          model: 'gpt-image-1',
          prompt: _prompt,
          size: '1024x1024',
          background: 'transparent',
          quality: 'low',
          output_format: 'webp',
          response_format: 'b64_json',
        });
        break; // 成功则跳出循环
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (
          error instanceof APIConnectionTimeoutError &&
          attempt < maxRetries
        ) {
          this.logger.warn(
            `Icon[${iconId}]: APIConnectionTimeoutError on attempt ${attempt + 1}, retrying...`,
          );
          continue;
        }

        // 非超时错误或已用完重试次数，直接抛出
        throw error;
      }
    }

    if (!response) {
      const errorMessage = lastError
        ? lastError instanceof Error
          ? lastError.message
          : String(lastError)
        : 'Failed to generate icon after retries';
      const errorStack =
        lastError instanceof Error ? lastError.stack : undefined;
      this.logger.error(
        `Icon[${iconId}]: Failed to generate icon after ${maxRetries} retries: ${errorMessage}`,
        errorStack,
      );
      // 继续执行，让下面的 else 分支统一处理失败
    }

    if (
      response &&
      response.data &&
      response.data.length > 0 &&
      response.data[0].b64_json
    ) {
      this.logger.log(`Icon[${iconId}]: Generated icon successfully`);
      const b64_json = response.data[0].b64_json;

      try {
        // 将base64转换为Buffer
        const buffer = Buffer.from(b64_json, 'base64');

        // 生成OSS文件路径
        const fileName = `icons/${iconId}-${Date.now()}.webp`;

        // 上传到OSS
        const ossResult = await this.ossClient.put(fileName, buffer);

        const ossName = ossResult.name;
        this.logger.log(`Icon[${iconId}]: Uploaded icon to OSS: ${ossName}`);

        // 保存OSS URL到数据库
        await this.prisma.answerIcon.update({
          where: { id: iconId },
          data: {
            status: 'GENERATED',
            url: ossName,
          },
        });

        const ossUrl = this.ossClient.signatureUrl(ossName, {
          expires: 3600,
        });

        this.progressSubject.next({
          iconId: iconId,
          status: 'GENERATED',
          url: ossUrl,
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to upload icon to OSS: ${errorMessage}`,
          errorStack,
        );
        await this.prisma.answerIcon.update({
          where: { id: iconId },
          data: {
            status: 'FAILED',
          },
        });
        this.progressSubject.next({
          iconId: iconId,
          status: 'FAILED',
          url: '',
        });
      }
    } else {
      await this.prisma.answerIcon.update({
        where: { id: iconId },
        data: {
          status: 'FAILED',
        },
      });
      this.progressSubject.next({
        iconId: iconId,
        status: 'FAILED',
        url: '',
      });
    }

    return response;
  }

  /**
   * 获取指定任务的进度流
   * 在获取到 GENERATED 或 FAILED 之前，每5秒发送一次 PENDING
   * 获取到结果之后再也不发送
   */
  /**
   * 生成签名后的 OSS URL
   * @param ossPath OSS 文件路径
   * @param expires 过期时间（秒），默认 3600
   * @returns 签名后的 URL，如果 ossPath 为空则返回 null
   */
  getSignedUrl(
    ossPath: string | null | undefined,
    expires: number = 3600,
  ): string | null {
    if (!ossPath) {
      return null;
    }
    return this.ossClient.signatureUrl(ossPath, { expires });
  }

  getProgressStream(iconId: string): Observable<any> {
    // 获取当前状态的辅助函数
    const getCurrentStatus = async (): Promise<{
      data: { status: string; url: string };
    }> => {
      const icon = await this.prisma.answerIcon.findUnique({
        where: { id: iconId },
        select: { status: true, url: true },
      });
      return {
        data: {
          status: icon?.status || 'PENDING',
          url: icon?.url || '',
        },
      };
    };

    // 监听实际状态更新的流（优先级最高）
    const updateStream = this.progressSubject.asObservable().pipe(
      filter(progress => progress.iconId === iconId),
      map(progress => ({
        data: {
          status: progress.status,
          url: progress.url,
        },
      })),
      take(1), // 只取第一个更新，之后完成
    );

    // 每5秒轮询一次，直到状态变为 GENERATED 或 FAILED
    const pollingStream = interval(5000).pipe(
      switchMap(() => from(getCurrentStatus())),
      takeWhile(
        (result: { data: { status: string; url: string } }) =>
          result.data.status !== 'GENERATED' && result.data.status !== 'FAILED',
        true, // inclusive: 包含最后一个值
      ),
    );

    // 合并：立即发送一次当前状态，然后每5秒轮询，同时监听更新
    return merge(
      // 立即发送一次当前状态
      from(getCurrentStatus()),
      // 每5秒轮询（如果状态是 PENDING）
      pollingStream,
      // 监听实际更新（优先级最高，会立即停止轮询）
      updateStream,
    ).pipe(
      takeWhile(
        (result: { data: { status: string; url: string } }) =>
          result.data.status !== 'GENERATED' && result.data.status !== 'FAILED',
        true, // inclusive: 包含最后一个值（GENERATED 或 FAILED）
      ),
    );
  }
}
