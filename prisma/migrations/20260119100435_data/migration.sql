-- Step 0: Create CUID generation function
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

-- Step 1: Rename categories
UPDATE "categories" SET "name" = 'Human Warmth' WHERE "name" = 'Shared Moments';
UPDATE "categories" SET "name" = 'Small Wins' WHERE "name" = 'Personal Growth';
UPDATE "categories" SET "name" = 'Inner Peace' WHERE "name" = 'Inner Strength';

-- Step 2: Migrate questions from Meaningful Work to Small Wins
UPDATE "questions" 
SET "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Small Wins')
WHERE "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Meaningful Work');

-- Step 3: Migrate questions from Playful Spirit to Inner Peace
UPDATE "questions" 
SET "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Inner Peace')
WHERE "category_id" = (SELECT "id" FROM "categories" WHERE "name" = 'Playful Spirit');

-- Step 4: Delete obsolete categories
DELETE FROM "categories" WHERE "name" IN ('Meaningful Work', 'Playful Spirit');

-- Step 5: Insert sub categories for Small Wins
DO $$
DECLARE
  parent_id_var TEXT;
BEGIN
  SELECT "id" INTO parent_id_var FROM "categories" WHERE "name" = 'Small Wins' AND "parent_id" IS NULL;
  INSERT INTO "categories" ("id", "name", "sequence", "parent_id", "updated_at") VALUES
    (generate_cuid(), 'Anchor Question', 1, parent_id_var, NOW()),
    (generate_cuid(), 'Work & Effort', 2, parent_id_var, NOW()),
    (generate_cuid(), 'Life & Discipline', 3, parent_id_var, NOW());
END $$;

-- Step 6: Insert sub categories for Simple Joys
DO $$
DECLARE
  parent_id_var TEXT;
BEGIN
  SELECT "id" INTO parent_id_var FROM "categories" WHERE "name" = 'Simple Joys' AND "parent_id" IS NULL;
  INSERT INTO "categories" ("id", "name", "sequence", "parent_id", "updated_at") VALUES
    (generate_cuid(), 'Anchor Question', 1, parent_id_var, NOW()),
    (generate_cuid(), 'Sensory Delight', 2, parent_id_var, NOW()),
    (generate_cuid(), 'Play & Surprise', 3, parent_id_var, NOW());
END $$;

-- Step 7: Insert sub categories for Inner Peace
DO $$
DECLARE
  parent_id_var TEXT;
BEGIN
  SELECT "id" INTO parent_id_var FROM "categories" WHERE "name" = 'Inner Peace' AND "parent_id" IS NULL;
  INSERT INTO "categories" ("id", "name", "sequence", "parent_id", "updated_at") VALUES
    (generate_cuid(), 'Anchor Question', 1, parent_id_var, NOW()),
    (generate_cuid(), 'The Exhale', 2, parent_id_var, NOW()),
    (generate_cuid(), 'Sanctuary', 3, parent_id_var, NOW());
END $$;

-- Step 8: Insert sub categories for Human Warmth
DO $$
DECLARE
  parent_id_var TEXT;
BEGIN
  SELECT "id" INTO parent_id_var FROM "categories" WHERE "name" = 'Human Warmth' AND "parent_id" IS NULL;
  INSERT INTO "categories" ("id", "name", "sequence", "parent_id", "updated_at") VALUES
    (generate_cuid(), 'Anchor Question', 1, parent_id_var, NOW()),
    (generate_cuid(), 'Bonding', 2, parent_id_var, NOW()),
    (generate_cuid(), 'Appreciation', 3, parent_id_var, NOW());
END $$;

-- Step 9: Drop the CUID generation function
DROP FUNCTION IF EXISTS generate_cuid();