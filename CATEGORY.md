# Now
### Category1: ✨ Small Wins
#### The Anchor Question
1. "What was one little thing that you feel proud of yourself for today?" [Cluster: Anchor]
#### Work & Effort
2. "What is a tiny problem you finally solved today that had been stuck for a while?" [Cluster: Completion]
3. "Which little task did you finish that made your mental load feel lighter?" [Cluster: Completion]
4. "What little task did you feel like you knew what you were doing today?" [Cluster: Competence]
5. "What was a small idea you shared or spoke up about today?" [Cluster: Courage]
6. "What little piece of positive feedback did you experience at work/school?" [Cluster: Validation]
7. "What was a tiny hurdle or creative block you managed to jump over today?" [Cluster: Courage]
#### Life & Discipline
8. "When did you choose a small healthy habit over the easy option today?" [Cluster: Discipline]
9. "What was a little mess (digital or physical) that you finally cleaned up today?" [Cluster: Discipline]
10. "How did you manage to start the morning with a little ritual on your own terms?" [Cluster: Routine]
11. "What was a brief moment where you overcame hesitation and just went for it?" [Cluster: Courage]
12. "What was a smart little choice you made with your money today?" [Cluster: Discipline]
13. "In what situation did you successfully set a small boundary today?" [Cluster: Boundaries]
### Category2: ☀️ Simple Joys
Theme: (Agency, Pride, Growth)
#### The Anchor Question
14. "What was one little thing that made you happy today?" [Cluster: Anchor]
#### Sensory Delight
15. "What was the single tastiest little bite or sip you had today?" [Cluster: Taste]
16. "What was a brief moment where the light or the weather looked particularly beautiful?" [Cluster: Visual]
17. "What little sound or song instantly shifted your mood for the better?" [Cluster: Audio]
18. "What little thing caught your eye today that felt like a secret just for you?" [Cluster: Visual]
19. "What little sight made you pause for a second today?" [Cluster: Visual]
#### Play & Surprise
20. "What little thing happened today that made you laugh out loud?" [Cluster: Humor]
21. "What is something new you tried today, even if it was just a tiny change?" [Cluster: Novelty]
22. "When did you allow yourself a little moment of silliness or playfulness today?" [Cluster: Play]
23. "What was a small surprise or a stroke of luck that happened today?" [Cluster: Novelty]
24. "What little thing sparked your curiosity or fascination today?" [Cluster: Curiosity]
25. "What small treat did you give yourself today?" [Cluster: Treat]
### Category3: 🍃 Inner Peace
Theme: (Agency, Pride, Growth)
#### The Anchor Question
26. "What was one little moment of peace or quiet you found today?" [Cluster: Anchor]
#### The Exhale
27. "At what specific moment did the weight of the day finally drop off?" [Cluster: Relief]
28. "What is a little worry you have decided to put down for the night?" [Cluster: Unloading]
29. "When did the 'rush' finally slow down for a brief pause?" [Cluster: Relief]
30. "What is one little task you are simply glad is over and done with today?" [Cluster: Relief]
31. "What did it feel like to finally take a little rest after a long stretch?" [Cluster: Body]
#### Sanctuary
32. "When did you feel a small sense of safety and ease today?" [Cluster: Sanctuary]
33. "Where did you find a little corner of solitude just for yourself today?" [Cluster: Sanctuary]
34. "What is bringing you a little sense of comfort in your space right now?" [Cluster: Sanctuary]
35. "What was your little glimpse of nature or the sky like today?" [Cluster: Nature]
36. "What was a tiny way you were kind to your body today?" [Cluster: Body]
37. "When did you allow yourself to do absolutely nothing for a little while?" [Cluster: Unloading]
38. "What is a tiny physical sensation of comfort you are feeling right now?" [Cluster: Body]
### Category4: ❤️ Human Warmth
Theme: (Connection, Resonance, Love)
#### The Anchor Question
39. "What was one little interaction that warmed your heart today?" [Cluster: Anchor]
#### Bonding
40. "What interaction brought a little spark of good energy into your day?" [Cluster: Interaction]
41. "What triggered a little laugh or a good talk shared with someone today?" [Cluster: Interaction]
42. "What was a nice little moment you shared over food or drink today?" [Cluster: Shared Activity]
43. "When did you feel a brief connection with a stranger or a pet today?" [Cluster: Strangers/Pets]
44. "What was the moment you reconnected with someone you care about?" [Cluster: Interaction]
#### Appreciation
45. "What small act of kindness did someone do for you today?" [Cluster: Receiving]
46. "In what little way were you able to help or be kind to someone else today?" [Cluster: Giving]
47. "Which little message or call made your heart feel lighter today?" [Cluster: Receiving]
48. "What little thing did someone do today that made you glad they exist?" [Cluster: Gratitude]
49. "What did you see someone else do today that made you smile a little?" [Cluster: Observation]
50. "What interaction brought out your best side today?" [Cluster: Interaction]
51. "What little gesture of love did you witness or receive today?" [Cluster: Receiving]
52. "Which little memory of a loved one brought you comfort today?" [Cluster: Memory]





# Prev

```ts
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
```

