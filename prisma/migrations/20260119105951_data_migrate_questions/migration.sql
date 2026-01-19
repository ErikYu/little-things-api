-- ============================================
-- Question Migration: Old Schema → New Schema
-- 基于 CATEGORY_MAP.md 的映射关系
-- ============================================

-- ============================================
-- STEP 0: Create CUID generation function
-- ============================================
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  counter_part TEXT;
  random_part TEXT;
BEGIN
  timestamp_part := LPAD(TO_HEX((EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT), 8, '0');
  counter_part := LPAD(TO_HEX((RANDOM() * 1679616)::INT), 4, '0');
  random_part := SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 12);
  RETURN 'c' || LOWER(timestamp_part || counter_part || random_part);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 前提条件说明
-- ============================================
-- Categories 已在 20260119100435_data migration 中创建
-- 本 migration 只负责迁移和更新 questions 数据

-- ============================================
-- STEP 1: 标记要删除的问题 (REMOVED)
-- ============================================

-- 共 7 个问题需要标记 deleted_at
UPDATE questions SET deleted_at = NOW(), updated_at = NOW()
WHERE title IN (
  -- P2, P5, P7 from Personal Growth
  'What was a moment today where you felt most like your authentic self?',
  'What''s a gentle promise you can make to yourself for tomorrow?',
  'If your future self sent you a one-word message today, what would it be?',
  
  -- M4 from Meaningful Work
  'What small part of your workspace makes you feel focused or happy?',
  
  -- SM5 from Shared Moments
  'What "little thing" do you think a close friend would say they appreciate about you?',
  
  -- IS7 from Inner Strength
  'What''s a piece of gentle advice your heart gave you today?'
);


-- ============================================
-- STEP 2: 处理合并的问题 (MERGE)
-- ============================================

-- 2.1 Q1 合并: M3 + IS1 → Q1
-- M3: "What is one specific accomplishment from your day's effort, no matter how small?"
-- IS1: "What was a small, personal win for you today?"
-- → Q1: "What was one little thing that you feel proud of yourself for today?"

DO $$
DECLARE
  v_q1_id TEXT;
  v_m3_id TEXT;
  v_is1_id TEXT;
BEGIN
  -- 找到问题 IDs
  SELECT id INTO v_m3_id FROM questions WHERE title = 'What is one specific accomplishment from your day''s effort, no matter how small?' AND deleted_at IS NULL;
  SELECT id INTO v_is1_id FROM questions WHERE title = 'What was a small, personal win for you today?' AND deleted_at IS NULL;
  
  -- 选择 M3 作为主问题，将其更新为新问题
  v_q1_id := v_m3_id;
  
  -- 将 IS1 的所有 answers 转移到 M3
  UPDATE answers SET question_id = v_q1_id, updated_at = NOW()
  WHERE question_id = v_is1_id;
  
  -- 将 IS1 的所有 pinned 记录转移到 M3
  UPDATE question_user_pinned SET question_id = v_q1_id
  WHERE question_id = v_is1_id;
  
  -- 软删除 IS1
  UPDATE questions SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = v_is1_id;
END $$;


-- 2.2 Q2 合并: P1 + M5 → Q2
-- P1: "What's a small step you took towards a personal goal?"
-- M5: "What was a problem you made progress on?"
-- → Q2: "What is a tiny problem you finally solved today that had been stuck for a while?"

DO $$
DECLARE
  v_q2_id TEXT;
  v_p1_id TEXT;
  v_m5_id TEXT;
BEGIN
  SELECT id INTO v_p1_id FROM questions WHERE title = 'What''s a small step you took towards a personal goal?' AND deleted_at IS NULL;
  SELECT id INTO v_m5_id FROM questions WHERE title = 'What was a problem you made progress on?' AND deleted_at IS NULL;
  
  -- 选择 M5 作为主问题
  v_q2_id := v_m5_id;
  
  -- 将 P1 的 answers 转移
  UPDATE answers SET question_id = v_q2_id, updated_at = NOW()
  WHERE question_id = v_p1_id;
  
  UPDATE question_user_pinned SET question_id = v_q2_id
  WHERE question_id = v_p1_id;
  
  -- 软删除 P1
  UPDATE questions SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = v_p1_id;
END $$;


-- 2.3 Q22 合并: PS1 + PS3 + PS6 → Q22
-- PS1: "What was one thing you saw that was delightfully absurd or silly?"
-- PS3: "Describe a moment where you felt like a kid again."
-- PS6: "What was the most playful moment of your day?"
-- → Q22: "When did you allow yourself a little moment of silliness or playfulness today?"

DO $$
DECLARE
  v_q22_id TEXT;
  v_ps1_id TEXT;
  v_ps3_id TEXT;
  v_ps6_id TEXT;
BEGIN
  SELECT id INTO v_ps1_id FROM questions WHERE title = 'What was one thing you saw that was delightfully absurd or silly?' AND deleted_at IS NULL;
  SELECT id INTO v_ps3_id FROM questions WHERE title = 'Describe a moment where you felt like a kid again.' AND deleted_at IS NULL;
  SELECT id INTO v_ps6_id FROM questions WHERE title = 'What was the most playful moment of your day?' AND deleted_at IS NULL;
  
  -- 选择 PS6 作为主问题
  v_q22_id := v_ps6_id;
  
  -- 将 PS1 和 PS3 的 answers 转移
  UPDATE answers SET question_id = v_q22_id, updated_at = NOW()
  WHERE question_id IN (v_ps1_id, v_ps3_id);
  
  UPDATE question_user_pinned SET question_id = v_q22_id
  WHERE question_id IN (v_ps1_id, v_ps3_id);
  
  -- 软删除 PS1 和 PS3
  UPDATE questions SET deleted_at = NOW(), updated_at = NOW()
  WHERE id IN (v_ps1_id, v_ps3_id);
END $$;


-- 2.4 Q28 合并: IS2 + IS4 → Q28
-- IS2: "What emotion showed up today that you simply noticed without judgment?"
-- IS4: "Describe a moment when you were able to let go of a small worry."
-- → Q28: "What is a little worry you have decided to put down for the night?"

DO $$
DECLARE
  v_q28_id TEXT;
  v_is2_id TEXT;
  v_is4_id TEXT;
BEGIN
  SELECT id INTO v_is2_id FROM questions WHERE title = 'What emotion showed up today that you simply noticed without judgment?' AND deleted_at IS NULL;
  SELECT id INTO v_is4_id FROM questions WHERE title = 'Describe a moment when you were able to let go of a small worry.' AND deleted_at IS NULL;
  
  -- 选择 IS4 作为主问题
  v_q28_id := v_is4_id;
  
  -- 将 IS2 的 answers 转移
  UPDATE answers SET question_id = v_q28_id, updated_at = NOW()
  WHERE question_id = v_is2_id;
  
  UPDATE question_user_pinned SET question_id = v_q28_id
  WHERE question_id = v_is2_id;
  
  -- 软删除 IS2
  UPDATE questions SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = v_is2_id;
END $$;


-- ============================================
-- STEP 3: 更新重写的问题 (REWRITE)
-- ============================================

DO $$
DECLARE
  v_small_wins_id TEXT;
  v_simple_joys_id TEXT;
  v_inner_peace_id TEXT;
  v_human_warmth_id TEXT;
  
  v_anchor_small_wins_id TEXT;
  v_work_effort_id TEXT;
  v_life_discipline_id TEXT;
  
  v_anchor_simple_joys_id TEXT;
  v_sensory_delight_id TEXT;
  v_play_surprise_id TEXT;
  
  v_anchor_inner_peace_id TEXT;
  v_exhale_id TEXT;
  v_sanctuary_id TEXT;
  
  v_anchor_human_warmth_id TEXT;
  v_bonding_id TEXT;
  v_appreciation_id TEXT;
BEGIN
  -- 获取所有 category IDs
  SELECT id INTO v_small_wins_id FROM categories WHERE name = 'Small Wins' AND parent_id IS NULL;
  SELECT id INTO v_simple_joys_id FROM categories WHERE name = 'Simple Joys' AND parent_id IS NULL;
  SELECT id INTO v_inner_peace_id FROM categories WHERE name = 'Inner Peace' AND parent_id IS NULL;
  SELECT id INTO v_human_warmth_id FROM categories WHERE name = 'Human Warmth' AND parent_id IS NULL;
  
  SELECT id INTO v_anchor_small_wins_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_small_wins_id;
  SELECT id INTO v_work_effort_id FROM categories WHERE name = 'Work & Effort' AND parent_id = v_small_wins_id;
  SELECT id INTO v_life_discipline_id FROM categories WHERE name = 'Life & Discipline' AND parent_id = v_small_wins_id;
  
  SELECT id INTO v_anchor_simple_joys_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_simple_joys_id;
  SELECT id INTO v_sensory_delight_id FROM categories WHERE name = 'Sensory Delight' AND parent_id = v_simple_joys_id;
  SELECT id INTO v_play_surprise_id FROM categories WHERE name = 'Play & Surprise' AND parent_id = v_simple_joys_id;
  
  SELECT id INTO v_anchor_inner_peace_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_inner_peace_id;
  SELECT id INTO v_exhale_id FROM categories WHERE name = 'The Exhale' AND parent_id = v_inner_peace_id;
  SELECT id INTO v_sanctuary_id FROM categories WHERE name = 'Sanctuary' AND parent_id = v_inner_peace_id;
  
  SELECT id INTO v_anchor_human_warmth_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_human_warmth_id;
  SELECT id INTO v_bonding_id FROM categories WHERE name = 'Bonding' AND parent_id = v_human_warmth_id;
  SELECT id INTO v_appreciation_id FROM categories WHERE name = 'Appreciation' AND parent_id = v_human_warmth_id;

  -- =====================================
  -- Small Wins (Category 1)
  -- =====================================
  
  -- Q1: M3 (已在合并步骤中选为主问题)
  UPDATE questions SET 
    title = 'What was one little thing that you feel proud of yourself for today?',
    category_id = v_small_wins_id,
    sub_category_id = v_anchor_small_wins_id,
    cluster = 'Anchor',
    sequence = 1,
    updated_at = NOW()
  WHERE title = 'What is one specific accomplishment from your day''s effort, no matter how small?' AND deleted_at IS NULL;
  
  -- Q2: M5 (已在合并步骤中选为主问题)
  UPDATE questions SET 
    title = 'What is a tiny problem you finally solved today that had been stuck for a while?',
    category_id = v_small_wins_id,
    sub_category_id = v_work_effort_id,
    cluster = 'Completion',
    sequence = 2,
    updated_at = NOW()
  WHERE title = 'What was a problem you made progress on?' AND deleted_at IS NULL;
  
  -- Q3: M1 → "Which little task did you finish that made your mental load feel lighter?"
  UPDATE questions SET 
    title = 'Which little task did you finish that made your mental load feel lighter?',
    category_id = v_small_wins_id,
    sub_category_id = v_work_effort_id,
    cluster = 'Completion',
    sequence = 3,
    updated_at = NOW()
  WHERE title = 'What small task did you complete that felt satisfying?' AND deleted_at IS NULL;
  
  -- Q5: M2 → "What was a small idea you shared or spoke up about today?"
  UPDATE questions SET 
    title = 'What was a small idea you shared or spoke up about today?',
    category_id = v_small_wins_id,
    sub_category_id = v_work_effort_id,
    cluster = 'Courage',
    sequence = 5,
    updated_at = NOW()
  WHERE title = 'What was a new idea or a moment of clarity you had?' AND deleted_at IS NULL;
  
  -- Q7: P4 → "What was a tiny hurdle or creative block you managed to jump over today?"
  UPDATE questions SET 
    title = 'What was a tiny hurdle or creative block you managed to jump over today?',
    category_id = v_small_wins_id,
    sub_category_id = v_work_effort_id,
    cluster = 'Courage',
    sequence = 7,
    updated_at = NOW()
  WHERE title = 'What was a small challenge you successfully navigated?' AND deleted_at IS NULL;
  
  -- Q8: P6 → "When did you choose a small healthy habit over the easy option today?"
  UPDATE questions SET 
    title = 'When did you choose a small healthy habit over the easy option today?',
    category_id = v_small_wins_id,
    sub_category_id = v_life_discipline_id,
    cluster = 'Discipline',
    sequence = 8,
    updated_at = NOW()
  WHERE title = 'What was a small, conscious choice you made that you''re happy with?' AND deleted_at IS NULL;
  
  -- Q10: S5 → "How did you manage to start the morning with a little ritual on your own terms?"
  UPDATE questions SET 
    title = 'How did you manage to start the morning with a little ritual on your own terms?',
    category_id = v_small_wins_id,
    sub_category_id = v_life_discipline_id,
    cluster = 'Routine',
    sequence = 10,
    updated_at = NOW()
  WHERE title = 'What part of your daily routine did you genuinely enjoy?' AND deleted_at IS NULL;
  
  -- Q13: IS5 → "In what situation did you successfully set a small boundary today?"
  UPDATE questions SET 
    title = 'In what situation did you successfully set a small boundary today?',
    category_id = v_small_wins_id,
    sub_category_id = v_life_discipline_id,
    cluster = 'Boundaries',
    sequence = 13,
    updated_at = NOW()
  WHERE title = 'What was a quiet decision you made that you''re proud of?' AND deleted_at IS NULL;
  
  -- =====================================
  -- Simple Joys (Category 2)
  -- =====================================
  
  -- Q14: S1 → "What was one little thing that made you happy today?"
  UPDATE questions SET 
    title = 'What was one little thing that made you happy today?',
    category_id = v_simple_joys_id,
    sub_category_id = v_anchor_simple_joys_id,
    cluster = 'Anchor',
    sequence = 14,
    updated_at = NOW()
  WHERE title = 'What is one little thing that made you happy today?' AND deleted_at IS NULL;
  
  -- Q17: PS5 → "What little sound or song instantly shifted your mood for the better?"
  UPDATE questions SET 
    title = 'What little sound or song instantly shifted your mood for the better?',
    category_id = v_simple_joys_id,
    sub_category_id = v_sensory_delight_id,
    cluster = 'Audio',
    sequence = 17,
    updated_at = NOW()
  WHERE title = 'What song or sound made you want to move or dance?' AND deleted_at IS NULL;
  
  -- Q22: PS6 (已在合并步骤中选为主问题)
  UPDATE questions SET 
    title = 'When did you allow yourself a little moment of silliness or playfulness today?',
    category_id = v_simple_joys_id,
    sub_category_id = v_play_surprise_id,
    cluster = 'Play',
    sequence = 22,
    updated_at = NOW()
  WHERE title = 'What was the most playful moment of your day?' AND deleted_at IS NULL;
  
  -- Q24: P3 → "What little thing sparked your curiosity or fascination today?"
  UPDATE questions SET 
    title = 'What little thing sparked your curiosity or fascination today?',
    category_id = v_simple_joys_id,
    sub_category_id = v_play_surprise_id,
    cluster = 'Curiosity',
    sequence = 24,
    updated_at = NOW()
  WHERE title = 'What is one new fact or piece of information you learned?' AND deleted_at IS NULL;
  
  -- Q25: PS2 → "What small treat did you give yourself today?"
  UPDATE questions SET 
    title = 'What small treat did you give yourself today?',
    category_id = v_simple_joys_id,
    sub_category_id = v_play_surprise_id,
    cluster = 'Treat',
    sequence = 25,
    updated_at = NOW()
  WHERE title = 'What small thing did you do just for the fun of it?' AND deleted_at IS NULL;
  
  -- =====================================
  -- Inner Peace (Category 3)
  -- =====================================
  
  -- Q26: S3 → "What was one little moment of peace or quiet you found today?"
  UPDATE questions SET 
    title = 'What was one little moment of peace or quiet you found today?',
    category_id = v_inner_peace_id,
    sub_category_id = v_anchor_inner_peace_id,
    cluster = 'Anchor',
    sequence = 26,
    updated_at = NOW()
  WHERE title = 'What small moment of peace did you experience today?' AND deleted_at IS NULL;
  
  -- Q28: IS4 (已在合并步骤中选为主问题)
  UPDATE questions SET 
    title = 'What is a little worry you have decided to put down for the night?',
    category_id = v_inner_peace_id,
    sub_category_id = v_exhale_id,
    cluster = 'Unloading',
    sequence = 28,
    updated_at = NOW()
  WHERE title = 'Describe a moment when you were able to let go of a small worry.' AND deleted_at IS NULL;
  
  -- Q29: IS3 → "When did the 'rush' finally slow down for a brief pause?"
  UPDATE questions SET 
    title = 'When did the ''rush'' finally slow down for a brief pause?',
    category_id = v_inner_peace_id,
    sub_category_id = v_exhale_id,
    cluster = 'Relief',
    sequence = 29,
    updated_at = NOW()
  WHERE title = 'What small thing helped you feel grounded when you were stressed?' AND deleted_at IS NULL;
  
  -- Q34: IS6 → "What is bringing you a little sense of comfort in your space right now?"
  UPDATE questions SET 
    title = 'What is bringing you a little sense of comfort in your space right now?',
    category_id = v_inner_peace_id,
    sub_category_id = v_sanctuary_id,
    cluster = 'Sanctuary',
    sequence = 34,
    updated_at = NOW()
  WHERE title = 'What object or place made you feel safe or secure?' AND deleted_at IS NULL;
  
  -- Q36: S2 → "What was a tiny way you were kind to your body today?"
  UPDATE questions SET 
    title = 'What was a tiny way you were kind to your body today?',
    category_id = v_inner_peace_id,
    sub_category_id = v_sanctuary_id,
    cluster = 'Body',
    sequence = 36,
    updated_at = NOW()
  WHERE title = 'What is one small thing you did for yourself today that felt kind?' AND deleted_at IS NULL;
  
  -- Q37: PS4 → "When did you allow yourself to do absolutely nothing for a little while?"
  UPDATE questions SET 
    title = 'When did you allow yourself to do absolutely nothing for a little while?',
    category_id = v_inner_peace_id,
    sub_category_id = v_sanctuary_id,
    cluster = 'Unloading',
    sequence = 37,
    updated_at = NOW()
  WHERE title = 'What is one task or item you can let go of to make tomorrow a little simpler?' AND deleted_at IS NULL;
  
  -- =====================================
  -- Human Warmth (Category 4)
  -- =====================================
  
  -- Q41: SM1 → "What triggered a little laugh or a good talk shared with someone today?"
  UPDATE questions SET 
    title = 'What triggered a little laugh or a good talk shared with someone today?',
    category_id = v_human_warmth_id,
    sub_category_id = v_bonding_id,
    cluster = 'Interaction',
    sequence = 41,
    updated_at = NOW()
  WHERE title = 'What was a specific comment that made you smile in a conversation?' AND deleted_at IS NULL;
  
  -- Q46: SM3 → "In what little way were you able to help or be kind to someone else today?"
  UPDATE questions SET 
    title = 'In what little way were you able to help or be kind to someone else today?',
    category_id = v_human_warmth_id,
    sub_category_id = v_appreciation_id,
    cluster = 'Giving',
    sequence = 46,
    updated_at = NOW()
  WHERE title = 'What was a small action you took to show someone you care?' AND deleted_at IS NULL;
  
  -- Q48: S4 → "What little thing did someone do today that made you glad they exist?"
  UPDATE questions SET 
    title = 'What little thing did someone do today that made you glad they exist?',
    category_id = v_human_warmth_id,
    sub_category_id = v_appreciation_id,
    cluster = 'Gratitude',
    sequence = 48,
    updated_at = NOW()
  WHERE title = 'Who is someone that made your day a little brighter?' AND deleted_at IS NULL;
  
  -- Q51: SM4 → "What little gesture of love did you witness or receive today?"
  UPDATE questions SET 
    title = 'What little gesture of love did you witness or receive today?',
    category_id = v_human_warmth_id,
    sub_category_id = v_appreciation_id,
    cluster = 'Receiving',
    sequence = 51,
    updated_at = NOW()
  WHERE title = 'What''s a specific "little thing" a loved one did that you appreciated?' AND deleted_at IS NULL;
  
  -- Q52: SM2 → "Which little memory of a loved one brought you comfort today?"
  UPDATE questions SET 
    title = 'Which little memory of a loved one brought you comfort today?',
    category_id = v_human_warmth_id,
    sub_category_id = v_appreciation_id,
    cluster = 'Memory',
    sequence = 52,
    updated_at = NOW()
  WHERE title = 'What memory of a friend or loved one came to mind today?' AND deleted_at IS NULL;

END $$;


-- ============================================
-- STEP 4: 插入新增问题 (NEW)
-- ============================================

DO $$
DECLARE
  v_small_wins_id TEXT;
  v_simple_joys_id TEXT;
  v_inner_peace_id TEXT;
  v_human_warmth_id TEXT;
  
  v_anchor_small_wins_id TEXT;
  v_work_effort_id TEXT;
  v_life_discipline_id TEXT;
  
  v_anchor_simple_joys_id TEXT;
  v_sensory_delight_id TEXT;
  v_play_surprise_id TEXT;
  
  v_anchor_inner_peace_id TEXT;
  v_exhale_id TEXT;
  v_sanctuary_id TEXT;
  
  v_anchor_human_warmth_id TEXT;
  v_bonding_id TEXT;
  v_appreciation_id TEXT;
BEGIN
  -- 获取所有 category IDs
  SELECT id INTO v_small_wins_id FROM categories WHERE name = 'Small Wins' AND parent_id IS NULL;
  SELECT id INTO v_simple_joys_id FROM categories WHERE name = 'Simple Joys' AND parent_id IS NULL;
  SELECT id INTO v_inner_peace_id FROM categories WHERE name = 'Inner Peace' AND parent_id IS NULL;
  SELECT id INTO v_human_warmth_id FROM categories WHERE name = 'Human Warmth' AND parent_id IS NULL;
  
  SELECT id INTO v_anchor_small_wins_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_small_wins_id;
  SELECT id INTO v_work_effort_id FROM categories WHERE name = 'Work & Effort' AND parent_id = v_small_wins_id;
  SELECT id INTO v_life_discipline_id FROM categories WHERE name = 'Life & Discipline' AND parent_id = v_small_wins_id;
  
  SELECT id INTO v_anchor_simple_joys_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_simple_joys_id;
  SELECT id INTO v_sensory_delight_id FROM categories WHERE name = 'Sensory Delight' AND parent_id = v_simple_joys_id;
  SELECT id INTO v_play_surprise_id FROM categories WHERE name = 'Play & Surprise' AND parent_id = v_simple_joys_id;
  
  SELECT id INTO v_anchor_inner_peace_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_inner_peace_id;
  SELECT id INTO v_exhale_id FROM categories WHERE name = 'The Exhale' AND parent_id = v_inner_peace_id;
  SELECT id INTO v_sanctuary_id FROM categories WHERE name = 'Sanctuary' AND parent_id = v_inner_peace_id;
  
  SELECT id INTO v_anchor_human_warmth_id FROM categories WHERE name = 'Anchor Question' AND parent_id = v_human_warmth_id;
  SELECT id INTO v_bonding_id FROM categories WHERE name = 'Bonding' AND parent_id = v_human_warmth_id;
  SELECT id INTO v_appreciation_id FROM categories WHERE name = 'Appreciation' AND parent_id = v_human_warmth_id;

  -- Small Wins - New Questions
  INSERT INTO questions (id, title, category_id, sub_category_id, cluster, sequence, created_at, updated_at)
  VALUES 
    (generate_cuid(), 'What little task did you feel like you knew what you were doing today?', v_small_wins_id, v_work_effort_id, 'Competence', 4, NOW(), NOW()),
    (generate_cuid(), 'What little piece of positive feedback did you experience at work/school?', v_small_wins_id, v_work_effort_id, 'Validation', 6, NOW(), NOW()),
    (generate_cuid(), 'What was a little mess (digital or physical) that you finally cleaned up today?', v_small_wins_id, v_life_discipline_id, 'Discipline', 9, NOW(), NOW()),
    (generate_cuid(), 'What was a brief moment where you overcame hesitation and just went for it?', v_small_wins_id, v_life_discipline_id, 'Courage', 11, NOW(), NOW()),
    (generate_cuid(), 'What was a smart little choice you made with your money today?', v_small_wins_id, v_life_discipline_id, 'Discipline', 12, NOW(), NOW());
  
  -- Simple Joys - New Questions
  INSERT INTO questions (id, title, category_id, sub_category_id, cluster, sequence, created_at, updated_at)
  VALUES 
    (generate_cuid(), 'What was the single tastiest little bite or sip you had today?', v_simple_joys_id, v_sensory_delight_id, 'Taste', 15, NOW(), NOW()),
    (generate_cuid(), 'What was a brief moment where the light or the weather looked particularly beautiful?', v_simple_joys_id, v_sensory_delight_id, 'Visual', 16, NOW(), NOW()),
    (generate_cuid(), 'What little thing caught your eye today that felt like a secret just for you?', v_simple_joys_id, v_sensory_delight_id, 'Visual', 18, NOW(), NOW()),
    (generate_cuid(), 'What little sight made you pause for a second today?', v_simple_joys_id, v_sensory_delight_id, 'Visual', 19, NOW(), NOW()),
    (generate_cuid(), 'What little thing happened today that made you laugh out loud?', v_simple_joys_id, v_play_surprise_id, 'Humor', 20, NOW(), NOW()),
    (generate_cuid(), 'What is something new you tried today, even if it was just a tiny change?', v_simple_joys_id, v_play_surprise_id, 'Novelty', 21, NOW(), NOW()),
    (generate_cuid(), 'What was a small surprise or a stroke of luck that happened today?', v_simple_joys_id, v_play_surprise_id, 'Novelty', 23, NOW(), NOW());
  
  -- Inner Peace - New Questions
  INSERT INTO questions (id, title, category_id, sub_category_id, cluster, sequence, created_at, updated_at)
  VALUES 
    (generate_cuid(), 'At what specific moment did the weight of the day finally drop off?', v_inner_peace_id, v_exhale_id, 'Relief', 27, NOW(), NOW()),
    (generate_cuid(), 'What is one little task you are simply glad is over and done with today?', v_inner_peace_id, v_exhale_id, 'Relief', 30, NOW(), NOW()),
    (generate_cuid(), 'What did it feel like to finally take a little rest after a long stretch?', v_inner_peace_id, v_exhale_id, 'Body', 31, NOW(), NOW()),
    (generate_cuid(), 'When did you feel a small sense of safety and ease today?', v_inner_peace_id, v_sanctuary_id, 'Sanctuary', 32, NOW(), NOW()),
    (generate_cuid(), 'Where did you find a little corner of solitude just for yourself today?', v_inner_peace_id, v_sanctuary_id, 'Sanctuary', 33, NOW(), NOW()),
    (generate_cuid(), 'What was your little glimpse of nature or the sky like today?', v_inner_peace_id, v_sanctuary_id, 'Nature', 35, NOW(), NOW()),
    (generate_cuid(), 'What is a tiny physical sensation of comfort you are feeling right now?', v_inner_peace_id, v_sanctuary_id, 'Body', 38, NOW(), NOW());
  
  -- Human Warmth - New Questions
  INSERT INTO questions (id, title, category_id, sub_category_id, cluster, sequence, created_at, updated_at)
  VALUES 
    (generate_cuid(), 'What was one little interaction that warmed your heart today?', v_human_warmth_id, v_anchor_human_warmth_id, 'Anchor', 39, NOW(), NOW()),
    (generate_cuid(), 'What interaction brought a little spark of good energy into your day?', v_human_warmth_id, v_bonding_id, 'Interaction', 40, NOW(), NOW()),
    (generate_cuid(), 'What was a nice little moment you shared over food or drink today?', v_human_warmth_id, v_bonding_id, 'Shared Activity', 42, NOW(), NOW()),
    (generate_cuid(), 'When did you feel a brief connection with a stranger or a pet today?', v_human_warmth_id, v_bonding_id, 'Strangers/Pets', 43, NOW(), NOW()),
    (generate_cuid(), 'What was the moment you reconnected with someone you care about?', v_human_warmth_id, v_bonding_id, 'Interaction', 44, NOW(), NOW()),
    (generate_cuid(), 'What small act of kindness did someone do for you today?', v_human_warmth_id, v_appreciation_id, 'Receiving', 45, NOW(), NOW()),
    (generate_cuid(), 'Which little message or call made your heart feel lighter today?', v_human_warmth_id, v_appreciation_id, 'Receiving', 47, NOW(), NOW()),
    (generate_cuid(), 'What did you see someone else do today that made you smile a little?', v_human_warmth_id, v_appreciation_id, 'Observation', 49, NOW(), NOW()),
    (generate_cuid(), 'What interaction brought out your best side today?', v_human_warmth_id, v_appreciation_id, 'Interaction', 50, NOW(), NOW());

END $$;


-- ============================================
-- STEP 5: 验证和统计
-- ============================================

-- 统计各类别的问题数量
DO $$
BEGIN
  RAISE NOTICE '================================';
  RAISE NOTICE 'Migration Summary';
  RAISE NOTICE '================================';
  RAISE NOTICE 'Active questions by category:';
  RAISE NOTICE '- Small Wins: % questions', (SELECT COUNT(*) FROM questions q JOIN categories c ON q.category_id = c.id WHERE c.name = 'Small Wins' AND q.deleted_at IS NULL);
  RAISE NOTICE '- Simple Joys: % questions', (SELECT COUNT(*) FROM questions q JOIN categories c ON q.category_id = c.id WHERE c.name = 'Simple Joys' AND q.deleted_at IS NULL);
  RAISE NOTICE '- Inner Peace: % questions', (SELECT COUNT(*) FROM questions q JOIN categories c ON q.category_id = c.id WHERE c.name = 'Inner Peace' AND q.deleted_at IS NULL);
  RAISE NOTICE '- Human Warmth: % questions', (SELECT COUNT(*) FROM questions q JOIN categories c ON q.category_id = c.id WHERE c.name = 'Human Warmth' AND q.deleted_at IS NULL);
  RAISE NOTICE '================================';
  RAISE NOTICE 'Deleted questions: %', (SELECT COUNT(*) FROM questions WHERE deleted_at IS NOT NULL);
  RAISE NOTICE '================================';
END $$;

-- ============================================
-- STEP 6: Drop the CUID generation function
-- ============================================
DROP FUNCTION IF EXISTS generate_cuid();