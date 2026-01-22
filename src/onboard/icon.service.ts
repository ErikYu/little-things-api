import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import OSS from 'ali-oss';
import axios from 'axios';
import Replicate from 'replicate';
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
import { PromptCategory } from '@prisma/client';
import { ImagesResponse } from 'openai/resources/images';
import { ApnService } from './apn.service';

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

const STEP_1_PROMPT = `
Role
You are the "Icon Architect" for "The Little Things", a minimalist Zakka-style journaling app.
Your goal is to translate user text into EXACTLY ONE simple object description for the Flux image generator.

Output Format (Strict JSON)
{
  "action": "Enum: [GENERATE, FALLBACK, BLOCK]",
  "stat_object": "string (Simple English Noun, e.g. 'Book')",
  "stat_category": "string (Broad Category, e.g. 'Study')",
  "visual_description": "string (The physical geometry of the ONE hero object)",
  "flux_prompt": "string (The FINAL assembled prompt)"
}
Core Logic (Execute in Order)

1. SAFETY & FILTER (Action: BLOCK)
If input implies self-harm, violence, hate speech, or explicit NSFW -> BLOCK.
If input is gibberish/too short -> BLOCK.

2. PHYSIOLOGICAL & PRIVATE TOPICS (The "Cute Filter")
Rule: Map private topics to specific "Visual Metaphors".
- Butt / Kegel / Hemorrhoids -> object: "cute peach", adjective: "fruit icon"
- Toilet / Poop -> object: "toilet paper roll", adjective: "bathroom roll"
- Menstruation / Cramps -> object: "hot water bottle" or "flower", negative_feelings: "bent stem curved 90 degrees downwards"
  
3. NEGATION HANDLING (The "Antidote" Strategy)
Trigger: "I don't like X", "Hate X", "No X".
Strategy: Do NOT visualize X. Find the "Antidote" (Positive state or symbol of simplicity).
- "Hate rain" -> object: "sun", adjective: "simple"
- "No money" -> object: "leaf", adjective: "minimalist"
- "No inspiration" -> object: "lightbulb", adjective: "shining"
  
4. SEMANTIC ANCHOR (Action: GENERATE)
CRITICAL MANDATE: THERE CAN BE ONLY ONE OBJECT.
Extract the single most representative physical noun.
A. Relevance Filter
Ignore background noise.
- "Saw a dog on the street" -> object: "dog" (Ignore "street")
B. Cultural Simplification (Globalize)
Convert complex items to generic Zakka primitives.
- "Luosifen/Hotpot" -> object: "bowl of noodles" or "cooking pot"
- "Ferrari" -> object: "toy car"
- "Dyson Vacuum" -> object: "broom" or "simple vacuum"
C. Define Object & Adjective
Object: Main physical noun.
Adjective: Visual state (e.g., "front view", "thick lines", "sitting").

Selection Hierarchy:
1. Discard Containers: "Saved a ticket in a jar" -> Hero: Ticket (Ignore jar).
2. Discard Frames: "Saw a dog through window" -> Hero: Dog (Ignore window).
3. Discard Verbs: "Thinking about pizza" -> Hero: Pizza (Ignore "thinking/brain").
4. Conflict Resolution:
  - "Coffee and Laptop" -> Hero: Laptop (Dominant object).
  - "Book and Pen" -> Hero: Book (Dominant object).
    

5. GEOMETRIC TRANSLATION (The Descriptor Engine)
Translate abstract feelings/adjectives into PHYSICAL GEOMETRY on the Hero Object.

Rules:
- Do NOT use abstract words ("sad", "happy", "messy").
- Do NOT describe the background.
- Focus on Shape, Texture, and State.
  
6. GEOMETRIC TRANSLATION (The Core Engine)
  CRITICAL RULE: You must combine the Main Object + All States/Adjectives into a single visual_description.
  STRICT PROHIBITION: Do NOT use abstract adjectives (e.g., "sad", "wilted", "hot", "messy", "cute", "broken").
  MANDATE: Translate them into PHYSICAL GEOMETRY (Lines, Shapes, Curves, Textures).
  
Translation Dictionary (Examples):
  - [Object: Flower] + [State: Wilted/Tired/Sad]
    - ❌ "a wilted flower"
    - ✅ "a flower with a bent stem curved 90 degrees downwards, the flower head is drooping and facing the ground, petals are falling off"
      
  - [Object: Heart] + [State: Broken/Sad]
    - ❌ "a broken heart"
    - ✅ "a heart shape split cleanly in two separate pieces, with a jagged zigzag crack gap down the middle"
      
  - [Object: Lines] + [State: Messy/Confused]
    - ❌ "messy lines"
    - ✅ "a tangled messy knot of scribble lines, resembling a ball of yarn"
      
  - [Object: Coffee] + [State: Hot]
    - ❌ "hot coffee"
    - ✅ "a coffee mug with three wavy steam lines rising upwards"
      
  - [Object: Cat] + [State: Cute/Sitting]
    - ❌ "cute cat"
    - ✅ "a round-shaped cat sitting with its tail wrapped around its paws"
      
  - [Object: Star] + [State: Twinkling]
    - ❌ "shining star"
    - ✅ "a tiny star with surrounding radial spark lines"

6. STATISTICAL NORMALIZATION
Assign stat_object (Simple Noun) and stat_category (Broad Category) for data tracking.

7. PROMPT ASSEMBLY

Construct the \`flux_prompt\` using a rigid modular structure for consistency.  
Formula: A minimalist black-and-white hand-drawn style icon. The subject is line art of [visual_description]. Using only one single thick black marker line. Lines must have slight organic randomness/wobble to look hand-made, not mechanical. The design is flat with no shading, no gradients, and no fine details. Pure white background. Simple, minimalist, thick lines.

Output: Strictly the JSON File, nothing else.
`;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export interface Step1Result {
  action: 'GENERATE' | 'FALLBACK' | 'BLOCK';
  stat_object?: string;
  stat_category?: string;
  visual_description?: string;
  flux_prompt?: string;
}

@Injectable()
export class IconService {
  logger = new Logger(IconService.name);

  replicate: Replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

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
    private readonly apnService: ApnService,
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

  /**
   * 解析可能包含 markdown 代码块格式的 JSON 文本
   * @param text 原始文本（可能包含 ```json 代码块标记）
   * @returns 解析后的 JSON 对象
   * @throws Error 如果解析失败
   */
  private parseJsonFromText<T = unknown>(text: string): T {
    // 移除首尾空白
    let jsonText: string = text.trim();

    // 移除可能的 markdown 代码块标记
    if (jsonText.startsWith('```json')) {
      // 移除开头的 ```json 和可能的换行
      jsonText = jsonText.replace(/^```json\s*\n?/, '');
      // 移除结尾的 ``` 和可能的换行
      jsonText = jsonText.replace(/\n?\s*```\s*$/, '');
    } else if (jsonText.startsWith('```')) {
      // 移除开头的 ``` 和可能的换行
      jsonText = jsonText.replace(/^```\s*\n?/, '');
      // 移除结尾的 ``` 和可能的换行
      jsonText = jsonText.replace(/\n?\s*```\s*$/, '');
    }

    // 再次 trim 以确保没有多余的空白
    jsonText = jsonText.trim();

    try {
      return JSON.parse(jsonText) as T;
    } catch (parseError) {
      const errorMsg =
        parseError instanceof Error
          ? parseError.message
          : 'Unknown parse error';
      this.logger.error(`Failed to parse JSON. Error: ${errorMsg}`);
      this.logger.error(
        `JSON text (first 200 chars): ${jsonText.substring(0, 200)}`,
      );
      throw new Error(`Failed to parse JSON response: ${errorMsg}`);
    }
  }

  private async getPrompt(): Promise<{
    content: string;
    versionId: string | null;
  }> {
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
        this.logger.log(
          `Using prompt from DB: ${dbPrompt.id}, version: ${dbPrompt.current_version_id || 'none'}`,
        );
        return {
          content: dbPrompt.content,
          versionId: dbPrompt.current_version_id,
        };
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch prompt from DB, using default. Error: ${error}`,
      );
    }

    return {
      content: DEFAULT_PROMPT,
      versionId: null,
    };
  }

  async generateIcon(iconId: string, reflection: string, sendApn = false) {
    // 查询 feature flag 来决定使用哪个版本
    const flag = await this.prisma.featureFlag.findFirst({
      where: { name: 'gen_icon_v2' },
    });

    // 如果 flag 存在且 enabled 为 true，使用 V2；否则使用 V1
    if (flag && flag.enabled) {
      this.logger.log(
        `Icon[${iconId}]: Using V2 generation (feature flag enabled)`,
      );
      return await this.generateIconV2(iconId, reflection, sendApn);
    } else {
      this.logger.log(
        `Icon[${iconId}]: Using V1 generation (feature flag disabled or not found)`,
      );
      return await this.generateIconV1(iconId, reflection, sendApn);
    }
  }

  async generateIconV1(iconId: string, reflection: string, sendApn = false) {
    const llm = new OpenAI({
      baseURL: 'https://api.tu-zi.com/v1',
    });
    const promptData = await this.getPrompt();
    const _prompt = promptData.content.replace(
      '[INSERT_USER_REFLECTION_HERE]',
      reflection,
    );

    // 记录版本
    await this.prisma.answerIcon.update({
      where: { id: iconId },
      data: {
        prompt_version_id: promptData.versionId,
      },
    });

    this.logger.log(`Icon[${iconId}]: Starting to generate icon`);

    let response: ImagesResponse;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.answerIcon.update({
        where: { id: iconId },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      throw new Error('Call error: Failed to generate');
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

        // 发送apn
        if (sendApn) {
          try {
            const icon = await this.prisma.answerIcon.findUnique({
              where: { id: iconId },
              include: {
                answer: {
                  select: { user_id: true },
                },
              },
            });

            if (icon?.answer?.user_id) {
              await this.apnService.sendNotificationToUser(
                icon.answer.user_id,
                {
                  title: 'Ta-da! Your icon is ready.',
                  body: 'Take a moment to see what your reflections have grown into.',
                },
              );
            }
          } catch (apnError) {
            // 推送失败不应该影响主流程，只记录日志
            this.logger.warn(
              `Failed to send APN notification for icon ${iconId}`,
              apnError instanceof Error ? apnError.stack : undefined,
            );
          }
        }
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

  async generateTestIcon(
    testIconId: string,
    testInput: string,
    promptContent: string,
  ) {
    const llm = new OpenAI({
      baseURL: 'https://api.tu-zi.com/v1',
    });
    const _prompt = promptContent.replace(
      '[INSERT_USER_REFLECTION_HERE]',
      testInput,
    );

    this.logger.log(`TestIcon[${testIconId}]: Starting to generate icon`);

    let response: ImagesResponse;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await this.prisma.promptTestIcon.update({
        where: { id: testIconId },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      throw new Error('Call error: Failed to generate');
    }

    if (
      response &&
      response.data &&
      response.data.length > 0 &&
      response.data[0].b64_json
    ) {
      this.logger.log(`TestIcon[${testIconId}]: Generated icon successfully`);
      const b64_json = response.data[0].b64_json;

      try {
        // 将base64转换为Buffer
        const buffer = Buffer.from(b64_json, 'base64');

        // 生成OSS文件路径
        const fileName = `test-icons/${testIconId}-${Date.now()}.webp`;

        // 上传到OSS
        const ossResult = await this.ossClient.put(fileName, buffer);

        const ossName = ossResult.name;
        this.logger.log(
          `TestIcon[${testIconId}]: Uploaded icon to OSS: ${ossName}`,
        );

        // 保存OSS URL到数据库
        await this.prisma.promptTestIcon.update({
          where: { id: testIconId },
          data: {
            status: 'GENERATED',
            url: ossName,
          },
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Failed to upload test icon to OSS: ${errorMessage}`,
          errorStack,
        );
        await this.prisma.promptTestIcon.update({
          where: { id: testIconId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });
      }
    } else {
      await this.prisma.promptTestIcon.update({
        where: { id: testIconId },
        data: {
          status: 'FAILED',
          error: 'No image data returned from API',
        },
      });
    }

    return response;
  }

  async generateIconV2(iconId: string, reflection: string, sendApn = false) {
    this.logger.log(
      `Icon[${iconId}]: Starting to generate icon V2 with Gemini`,
    );

    // 获取 OpenAI API Key (用于 Gemini API)
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      await this.prisma.answerIcon.update({
        where: { id: iconId },
        data: {
          status: 'FAILED',
          error: 'OPENAI_API_KEY is not configured',
        },
      });
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // 构建请求 prompt，将 reflection 插入到 STEP_1_PROMPT 中
    const prompt = `${STEP_1_PROMPT}\n\nUser reflection: ${reflection}`;

    try {
      // 调用 Gemini API
      const response = await axios.post<GeminiResponse>(
        'https://api.tu-zi.com/v1beta/models/gemini-3-flash-preview:generateContent',
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
              role: 'user',
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`Icon[${iconId}]: Gemini API response received`);

      // 解析响应
      const responseText =
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText || typeof responseText !== 'string') {
        throw new Error('No response text from Gemini API');
      }

      this.logger.log(
        `Icon[${iconId}]: Raw response text length: ${responseText.length}`,
      );

      // 解析 JSON（Gemini 可能返回 markdown 格式的 JSON）
      const step1Result = this.parseJsonFromText<Step1Result>(responseText);
      this.logger.log(
        `Icon[${iconId}]: Step 1 result - action: ${step1Result.action}`,
      );

      const input = {
        images: [],
        prompt: step1Result.flux_prompt,
        go_fast: false,
        guidance: 4,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 95,
        output_megapixels: '0.25',
      };

      const output = await this.replicate.run(
        'black-forest-labs/flux-2-klein-9b-base',
        { input },
      );

      // 获取图片 URL
      // output[0].url() 返回一个 URL 对象，href 属性就是图片 URL
      const firstOutput = output[0] as { url?: () => URL };
      const urlResult = firstOutput?.url?.();
      if (!urlResult || !(urlResult instanceof URL)) {
        throw new Error('No image URL returned from Replicate');
      }
      const imageUrl = urlResult.href;

      this.logger.log(
        `Icon[${iconId}]: Generated image from Replicate: ${imageUrl}`,
      );

      // 从 URL 流式下载并直接上传到 OSS（避免占用大量内存）
      const fileName = `icons/${iconId}-${Date.now()}.webp`;

      try {
        // 使用流式处理：边下载边上传统，不占用大量内存
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'stream',
        });

        // 直接上传流到 OSS
        const ossResult = await this.ossClient.put(
          fileName,
          imageResponse.data,
        );

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

        // 发送apn
        if (sendApn) {
          try {
            const icon = await this.prisma.answerIcon.findUnique({
              where: { id: iconId },
              include: {
                answer: {
                  select: { user_id: true },
                },
              },
            });

            if (icon?.answer?.user_id) {
              await this.apnService.sendNotificationToUser(
                icon.answer.user_id,
                {
                  title: 'Ta-da! Your icon is ready.',
                  body: 'Take a moment to see what your reflections have grown into.',
                },
              );
            }
          } catch (apnError) {
            // 推送失败不应该影响主流程，只记录日志
            this.logger.warn(
              `Failed to send APN notification for icon ${iconId}`,
              apnError instanceof Error ? apnError.stack : undefined,
            );
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        this.logger.error(
          `Icon[${iconId}]: Failed to upload icon to OSS: ${errorMessage}`,
          errorStack,
        );
        await this.prisma.answerIcon.update({
          where: { id: iconId },
          data: {
            status: 'FAILED',
            error: errorMessage,
          },
        });
        this.progressSubject.next({
          iconId: iconId,
          status: 'FAILED',
          url: '',
        });
        throw error;
      }

      return step1Result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(
        `Icon[${iconId}]: Failed to call Gemini API - ${errorMessage}`,
        err instanceof Error ? err.stack : undefined,
      );
      await this.prisma.answerIcon.update({
        where: { id: iconId },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });
      throw new Error(`Call error: Failed to generate - ${errorMessage}`);
    }
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
