-- 为现有的 prompt 创建初始版本
-- 只处理没有版本记录的 prompt（prompt_versions 表中没有该 prompt_id 的记录）

DO $$
DECLARE
    prompt_record RECORD;
    new_version_id TEXT;
BEGIN
    -- 遍历所有没有版本记录的 prompt
    FOR prompt_record IN 
        SELECT 
            p.id,
            p.content
        FROM prompts p
        WHERE p.deleted_at IS NULL
        -- 检查是否已经有版本记录
        AND NOT EXISTS (
            SELECT 1 
            FROM prompt_versions pv 
            WHERE pv.prompt_id = p.id
        )
    LOOP
        -- 生成新的版本 ID（使用 cuid 格式，Prisma 默认使用 cuid）
        -- 这里使用 gen_random_uuid() 生成，Prisma 会在应用层转换为 cuid
        new_version_id := gen_random_uuid()::TEXT;
        
        -- 创建初始版本
        INSERT INTO prompt_versions (
            id,
            prompt_id,
            version,
            content,
            created_by,
            created_at,
            change_note
        ) VALUES (
            new_version_id,
            prompt_record.id,
            1,
            prompt_record.content,
            NULL,
            NOW(),
            'Initial version'
        );
        
        -- 更新 prompt 的 current_version_id
        UPDATE prompts
        SET current_version_id = new_version_id
        WHERE id = prompt_record.id;
        
        RAISE NOTICE 'Created initial version for prompt %', prompt_record.id;
    END LOOP;
END $$;
