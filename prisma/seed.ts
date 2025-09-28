import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始种子数据初始化...');

  // 清理现有数据（可选，根据需要调整）
  console.log('🧹 清理现有数据...');
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 创建分类
  console.log('📂 创建分类...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Simple Joys',
        sequence: 1,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title: 'What is one little thing that made you happy today?',
              },
              {
                sequence: 2,
                title:
                  'What is one small thing you did for yourself today that felt kind?',
              },
              {
                sequence: 3,
                title: 'What small moment of peace did you experience today?',
              },
              {
                sequence: 4,
                title: 'Who is someone that made your day a little brighter?',
              },
              {
                sequence: 5,
                title:
                  'What part of your daily routine did you genuinely enjoy?',
              },
            ],
          },
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Personal Growth',
        sequence: 2,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title: "What's a small step you took towards a personal goal?",
              },
              {
                sequence: 2,
                title:
                  'What was a moment today where you felt most like your authentic self?',
              },
              {
                sequence: 3,
                title:
                  'What is one new fact or piece of information you learned?',
              },
              {
                sequence: 4,
                title: 'What was a small challenge you successfully navigated?',
              },
              {
                sequence: 5,
                title:
                  "What's a gentle promise you can make to yourself for tomorrow?",
              },
              {
                sequence: 6,
                title:
                  "What was a small, conscious choice you made that you're happy with?",
              },
              {
                sequence: 7,
                title:
                  'If your future self sent you a one-word message today, what would it be?',
              },
            ],
          },
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Meaningful Work',
        sequence: 3,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title: 'What small task did you complete that felt satisfying?',
              },
              {
                sequence: 2,
                title: 'What was a new idea or a moment of clarity you had?',
              },
              {
                sequence: 3,
                title:
                  "What is one specific accomplishment from your day's effort, no matter how small?",
              },
              {
                sequence: 4,
                title:
                  'What small part of your workspace makes you feel focused or happy?',
              },
              {
                sequence: 5,
                title: 'What was a problem you made progress on?',
              },
            ],
          },
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Shared Moments',
        sequence: 4,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title:
                  'What was a specific comment that made you smile in a conversation?',
              },
              {
                sequence: 2,
                title:
                  'What memory of a friend or loved one came to mind today?',
              },
              {
                sequence: 3,
                title:
                  'What was a small action you took to show someone you care?',
              },
              {
                sequence: 4,
                title:
                  'What\'s a specific "little thing" a loved one did that you appreciated?',
              },
              {
                sequence: 5,
                title:
                  'What "little thing" do you think a close friend would say they appreciate about you?',
              },
            ],
          },
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Inner Strength',
        sequence: 5,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title: 'What was a small, personal win for you today?',
              },
              {
                sequence: 2,
                title:
                  'What emotion showed up today that you simply noticed without judgment?',
              },
              {
                sequence: 3,
                title:
                  'What small thing helped you feel grounded when you were stressed?',
              },
              {
                sequence: 4,
                title:
                  'Describe a moment when you were able to let go of a small worry.',
              },
              {
                sequence: 5,
                title:
                  "What was a quiet decision you made that you're proud of?",
              },
              {
                sequence: 6,
                title: 'What object or place made you feel safe or secure?',
              },
              {
                sequence: 7,
                title:
                  "What's a piece of gentle advice your heart gave you today?",
              },
            ],
          },
        },
      },
    }),
    prisma.category.create({
      data: {
        name: 'Playful Spirit',
        sequence: 6,
        questions: {
          createMany: {
            data: [
              {
                sequence: 1,
                title:
                  'What was one thing you saw that was delightfully absurd or silly?',
              },
              {
                sequence: 2,
                title: 'What small thing did you do just for the fun of it?',
              },
              {
                sequence: 3,
                title: 'Describe a moment where you felt like a kid again.',
              },
              {
                sequence: 4,
                title:
                  'What is one task or item you can let go of to make tomorrow a little simpler?',
              },
              {
                sequence: 5,
                title: 'What song or sound made you want to move or dance?',
              },
              {
                sequence: 6,
                title: 'What was the most playful moment of your day?',
              },
            ],
          },
        },
      },
    }),
  ]);

  console.log(`✅ 创建了 ${categories.length} 个分类`);
}

main()
  .catch(e => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma
      .$disconnect()
      .then(() => {
        console.log('🌱 种子数据初始化完成, 断开数据库连接');
      })
      .catch(() => {
        // pass
      });
  });
