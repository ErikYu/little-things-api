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

-- Step 1: Insert feature flag for genIcon v2
INSERT INTO "feature_flags" ("id", "name", "enabled", "description", "created_at", "updated_at")
VALUES (
  generate_cuid(),
  'gen_icon_v2',
  false,
  'Control whether to use v2 version of icon generation. When enabled, uses generateIconV2; when disabled, uses the original generateIcon method.',
  NOW(),
  NOW()
);

-- Step 2: Drop the CUID generation function
DROP FUNCTION IF EXISTS generate_cuid();