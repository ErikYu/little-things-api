# Category & Question Mapping: Old → New

## 映射说明

### 变更类型标注
- 🔄 **REWRITE**: 语义保持，表达优化
- ➕ **NEW**: 全新问题
- 🗑️ **REMOVED**: 旧问题未保留
- 🔀 **SPLIT**: 一个旧问题拆分为多个新问题
- 🔗 **MERGE**: 多个旧问题合并为一个新问题

### 语义相似度
- ⭐⭐⭐: 高度相似（核心语义完全一致）
- ⭐⭐: 中度相似（同一主题但角度不同）
- ⭐: 低度相似（仅类别相关）

---

## 一、类别层级映射

| 旧类别 | 序号 | 新类别 | 序号 | 变更说明 |
|--------|------|--------|------|----------|
| Simple Joys | 1 | Simple Joys | 2 | 保留但重新定位，从首位移至第二 |
| Personal Growth | 2 | Small Wins | 1 | 重构为"小胜利"，聚焦成就感 |
| Meaningful Work | 3 | Small Wins | 1 | 合并至"Small Wins"，强调工作成就 |
| Shared Moments | 4 | Human Warmth | 4 | 扩展为人际温暖，更广泛的连接 |
| Inner Strength | 5 | Inner Peace | 3 | 从"力量"转向"平和"，强调放松 |
| Playful Spirit | 6 | Simple Joys | 2 | 合并至"Simple Joys"的玩乐维度 |

---

## 二、问题详细映射

### 旧类别1: Simple Joys → 新类别2: Simple Joys

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| S1 | What is one little thing that made you happy today? | Q14 | What was one little thing that made you happy today? | ⭐⭐⭐ | 🔄 REWRITE | "is"→"was" 时态统一 |
| S2 | What is one small thing you did for yourself today that felt kind? | Q36 | What was a tiny way you were kind to your body today? | ⭐⭐ | 🔄 REWRITE | 从"对自己"具体化到"对身体" |
| S3 | What small moment of peace did you experience today? | Q26 | What was one little moment of peace or quiet you found today? | ⭐⭐⭐ | 🔄 REWRITE | 增加"quiet"增强引导性 |
| S4 | Who is someone that made your day a little brighter? | Q48 | What little thing did someone do today that made you glad they exist? | ⭐⭐ | 🔄 REWRITE | 从"谁"改为"做了什么"，更具体 |
| S5 | What part of your daily routine did you genuinely enjoy? | Q10 | How did you manage to start the morning with a little ritual on your own terms? | ⭐⭐ | 🔄 REWRITE | 从"享受"聚焦到"掌控感" |

---

### 旧类别2: Personal Growth → 新类别1: Small Wins

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| P1 | What's a small step you took towards a personal goal? | Q2 | What is a tiny problem you finally solved today that had been stuck for a while? | ⭐⭐ | 🔗 MERGE | 从"目标进展"转向"解决问题" (与M5合并) |
| P2 | What was a moment today where you felt most like your authentic self? | - | - | - | 🗑️ REMOVED | 抽象问题被移除 |
| P3 | What is one new fact or piece of information you learned? | Q24 | What little thing sparked your curiosity or fascination today? | ⭐⭐ | 🔄 REWRITE | 从"学习"转向"好奇心激发" |
| P4 | What was a small challenge you successfully navigated? | Q7 | What was a tiny hurdle or creative block you managed to jump over today? | ⭐⭐⭐ | 🔄 REWRITE | 增加"创造性阻碍"使场景更具体 |
| P5 | What's a gentle promise you can make to yourself for tomorrow? | - | - | - | 🗑️ REMOVED | 未来导向问题被移除，聚焦当天 |
| P6 | What was a small, conscious choice you made that you're happy with? | Q8 | When did you choose a small healthy habit over the easy option today? | ⭐⭐ | 🔄 REWRITE | 从"有意识选择"具体化到"健康习惯" |
| P7 | If your future self sent you a one-word message today, what would it be? | - | - | - | 🗑️ REMOVED | 虚拟问题被移除 |

---

### 旧类别3: Meaningful Work → 新类别1: Small Wins (Work & Effort部分)

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| M1 | What small task did you complete that felt satisfying? | Q3 | Which little task did you finish that made your mental load feel lighter? | ⭐⭐⭐ | 🔄 REWRITE | 增加"心理负担减轻"的情感维度 |
| M2 | What was a new idea or a moment of clarity you had? | Q5 | What was a small idea you shared or spoke up about today? | ⭐⭐ | 🔄 REWRITE | 从"产生想法"升级到"表达想法" |
| M3 | What is one specific accomplishment from your day's effort, no matter how small? | Q1 | What was one little thing that you feel proud of yourself for today? | ⭐⭐⭐ | 🔗 MERGE | 从"成就"提升到"自豪感" (与IS1合并) |
| M4 | What small part of your workspace makes you feel focused or happy? | - | - | - | 🗑️ REMOVED | 环境类问题被移除 |
| M5 | What was a problem you made progress on? | Q2 | What is a tiny problem you finally solved today that had been stuck for a while? | ⭐⭐⭐ | 🔗 MERGE | 强调"终于解决"的完成感 (与P1合并) |

---

### 旧类别4: Shared Moments → 新类别4: Human Warmth

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| SM1 | What was a specific comment that made you smile in a conversation? | Q41 | What triggered a little laugh or a good talk shared with someone today? | ⭐⭐⭐ | 🔄 REWRITE | 从"评论"扩展到"对话" |
| SM2 | What memory of a friend or loved one came to mind today? | Q52 | Which little memory of a loved one brought you comfort today? | ⭐⭐⭐ | 🔄 REWRITE | 增加"comfort"情感标签 |
| SM3 | What was a small action you took to show someone you care? | Q46 | In what little way were you able to help or be kind to someone else today? | ⭐⭐⭐ | 🔄 REWRITE | 从"关心"扩展到"帮助/善意" |
| SM4 | What's a specific "little thing" a loved one did that you appreciated? | Q51 | What little gesture of love did you witness or receive today? | ⭐⭐⭐ | 🔄 REWRITE | 增加"witness"观察维度 |
| SM5 | What "little thing" do you think a close friend would say they appreciate about you? | - | - | - | 🗑️ REMOVED | 他人视角问题被移除 |

---

### 旧类别5: Inner Strength → 新类别3: Inner Peace

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| IS1 | What was a small, personal win for you today? | Q1 | What was one little thing that you feel proud of yourself for today? | ⭐⭐⭐ | 🔗 MERGE | 从"个人胜利"转向"自豪感" (与M3合并) |
| IS2 | What emotion showed up today that you simply noticed without judgment? | Q28 | What is a little worry you have decided to put down for the night? | ⭐⭐ | 🔗 MERGE | 从"观察情绪"到"放下担忧" (与IS4合并) |
| IS3 | What small thing helped you feel grounded when you were stressed? | Q29 | When did the 'rush' finally slow down for a brief pause? | ⭐⭐ | 🔄 REWRITE | 从"压力应对"到"节奏放缓" |
| IS4 | Describe a moment when you were able to let go of a small worry. | Q28 | What is a little worry you have decided to put down for the night? | ⭐⭐⭐ | 🔗 MERGE | 从描述到具体行动 (与IS2合并) |
| IS5 | What was a quiet decision you made that you're proud of? | Q13 | In what situation did you successfully set a small boundary today? | ⭐⭐ | 🔄 REWRITE | 从"决定"具体化到"设定边界" |
| IS6 | What object or place made you feel safe or secure? | Q34 | What is bringing you a little sense of comfort in your space right now? | ⭐⭐⭐ | 🔄 REWRITE | 从"安全感"转向"舒适感" |
| IS7 | What's a piece of gentle advice your heart gave you today? | - | - | - | 🗑️ REMOVED | 抽象问题被移除 |

---

### 旧类别6: Playful Spirit → 新类别2: Simple Joys (Play & Surprise部分)

| 旧ID | 旧问题 | 新ID | 新问题 | 相似度 | 变更类型 | 变更说明 |
|------|--------|------|--------|--------|----------|----------|
| PS1 | What was one thing you saw that was delightfully absurd or silly? | Q22 | When did you allow yourself a little moment of silliness or playfulness today? | ⭐⭐ | 🔗 MERGE | 从"观察"转向"参与" (与PS3/PS6合并) |
| PS2 | What small thing did you do just for the fun of it? | Q25 | What small treat did you give yourself today? | ⭐⭐⭐ | 🔄 REWRITE | 从"为乐趣"到"奖励自己" |
| PS3 | Describe a moment where you felt like a kid again. | Q22 | When did you allow yourself a little moment of silliness or playfulness today? | ⭐⭐⭐ | 🔗 MERGE | 表达更简洁 (与PS1/PS6合并) |
| PS4 | What is one task or item you can let go of to make tomorrow a little simpler? | Q37 | When did you allow yourself to do absolutely nothing for a little while? | ⭐⭐ | 🔄 REWRITE | 从"放弃任务"到"允许休息" |
| PS5 | What song or sound made you want to move or dance? | Q17 | What little sound or song instantly shifted your mood for the better? | ⭐⭐⭐ | 🔄 REWRITE | 从"肢体反应"到"情绪转变" |
| PS6 | What was the most playful moment of your day? | Q22 | When did you allow yourself a little moment of silliness or playfulness today? | ⭐⭐⭐ | 🔗 MERGE | 语义一致 (与PS1/PS3合并) |

---

## 三、合并关系详解（多对一映射）

以下新问题由**多个旧问题合并**而成，在新版本中只保留一个问题：

### 🔗 Q1: What was one little thing that you feel proud of yourself for today?
**合并自2个旧问题**：
- M3: What is one specific accomplishment from your day's effort? (成就)
- IS1: What was a small, personal win for you today? (个人胜利)

**合并逻辑**：从"完成成就"和"个人胜利"提炼为"自豪感"的核心体验

---

### 🔗 Q2: What is a tiny problem you finally solved today that had been stuck for a while?
**合并自2个旧问题**：
- P1: What's a small step you took towards a personal goal? (目标进展)
- M5: What was a problem you made progress on? (问题进展)

**合并逻辑**：从抽象的"进展"聚焦到具体的"解决卡住的问题"

---


### 🔗 Q22: When did you allow yourself a little moment of silliness or playfulness today?
**合并自3个旧问题** ⚠️ (最多合并)：
- PS1: What was one thing you saw that was delightfully absurd or silly? (观察搞笑)
- PS3: Describe a moment where you felt like a kid again. (像小孩)
- PS6: What was the most playful moment of your day? (玩耍时刻)

**合并逻辑**：从"观察"和"描述"统一为"允许自己玩耍"的主动参与

**⚠️ 数据迁移风险**：3个旧问题只能映射到1个新问题，可能造成信息丢失

---

### 🔗 Q28: What is a little worry you have decided to put down for the night?
**合并自2个旧问题**：
- IS2: What emotion showed up today that you simply noticed without judgment? (观察情绪)
- IS4: Describe a moment when you were able to let go of a small worry. (放下担忧)

**合并逻辑**：从"被动观察"到"主动决定放下"的行动导向

---

### 合并统计

| 新问题ID | 合并的旧问题数 | 相似度 | 数据迁移建议 |
|---------|---------------|--------|-------------|
| Q1 | 2 (M3, IS1) | ⭐⭐⭐ | 直接合并两个回答 |
| Q2 | 2 (P1, M5) | ⭐⭐⭐/⭐⭐ | 优先保留M5的回答 |
| Q22 | 3 (PS1, PS3, PS6) | ⭐⭐⭐/⭐⭐ | **风险**：建议保留最近的一条 |
| Q28 | 2 (IS2, IS4) | ⭐⭐⭐/⭐⭐ | 优先保留IS4的回答 |

**总计**：8个旧问题 → 4个新问题（压缩率50%）

---

## 四、新增问题清单（无旧版对应）

### Category 1: Small Wins

#### Subcategory: Work & Effort
- ➕ Q4: What little task did you feel like you knew what you were doing today? [Competence]
- ➕ Q6: What little piece of positive feedback did you experience at work/school? [Validation]

#### Subcategory: Life & Discipline
- ➕ Q9: What was a little mess (digital or physical) that you finally cleaned up today? [Discipline]
- ➕ Q11: What was a brief moment where you overcame hesitation and just went for it? [Courage]
- ➕ Q12: What was a smart little choice you made with your money today? [Discipline]

---

### Category 2: Simple Joys

#### Subcategory: Sensory Delight
- ➕ Q15: What was the single tastiest little bite or sip you had today? [Taste]
- ➕ Q16: What was a brief moment where the light or the weather looked particularly beautiful? [Visual]
- ➕ Q18: What little thing caught your eye today that felt like a secret just for you? [Visual]
- ➕ Q19: What little sight made you pause for a second today? [Visual]

#### Subcategory: Play & Surprise
- ➕ Q20: What little thing happened today that made you laugh out loud? [Humor]
- ➕ Q21: What is something new you tried today, even if it was just a tiny change? [Novelty]
- ➕ Q23: What was a small surprise or a stroke of luck that happened today? [Novelty]

---

### Category 3: Inner Peace

#### Subcategory: The Exhale
- ➕ Q27: At what specific moment did the weight of the day finally drop off? [Relief]
- ➕ Q30: What is one little task you are simply glad is over and done with today? [Relief]
- ➕ Q31: What did it feel like to finally take a little rest after a long stretch? [Body]

#### Subcategory: Sanctuary
- ➕ Q32: When did you feel a small sense of safety and ease today? [Sanctuary]
- ➕ Q33: Where did you find a little corner of solitude just for yourself today? [Sanctuary]
- ➕ Q35: What was your little glimpse of nature or the sky like today? [Nature]
- ➕ Q38: What is a tiny physical sensation of comfort you are feeling right now? [Body]

---

### Category 4: Human Warmth

#### Subcategory: Bonding
- ➕ Q40: What interaction brought a little spark of good energy into your day? [Interaction]
- ➕ Q42: What was a nice little moment you shared over food or drink today? [Shared Activity]
- ➕ Q43: When did you feel a brief connection with a stranger or a pet today? [Strangers/Pets]
- ➕ Q44: What was the moment you reconnected with someone you care about? [Interaction]

#### Subcategory: Appreciation
- ➕ Q45: What small act of kindness did someone do for you today? [Receiving]
- ➕ Q47: Which little message or call made your heart feel lighter today? [Receiving]
- ➕ Q49: What did you see someone else do today that made you smile a little? [Observation]
- ➕ Q50: What interaction brought out your best side today? [Interaction]

---

## 五、变更统计

| 变更类型 | 数量 | 占比 | 说明 |
|---------|------|------|------|
| 🔄 REWRITE | 19 | 36.5% | 一对一改写 |
| 🔗 MERGE | 8→4 | 7.7% | 多对一合并（8个旧问题合并为4个新问题） |
| ➕ NEW | 24 | 46.2% | 全新问题 |
| 🗑️ REMOVED | 7 | - | 完全删除 |
| **新版总计** | **52** | **100%** | - |
| **旧版总计** | **34** | - | - |

### 详细分解
- **有映射关系的旧问题**: 27个 (19个REWRITE + 8个MERGE)
- **无映射关系的旧问题**: 7个 (REMOVED)
- **新版独有问题**: 24个 (NEW)
- **新版中被合并的问题**: 4个 (接收8个旧问题)

---
