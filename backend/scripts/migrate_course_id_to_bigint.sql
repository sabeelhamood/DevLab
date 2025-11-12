-- Migration script to convert course_id from text to bigint
-- Run this directly in Supabase SQL Editor

-- Convert course_completions.course_id from text to bigint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'course_completions' 
      AND column_name = 'course_id'
      AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Converting course_completions.course_id from text to bigint';
    ALTER TABLE "course_completions" 
    ALTER COLUMN "course_id" TYPE bigint USING CASE 
      WHEN "course_id" ~ '^[0-9]+$' THEN "course_id"::bigint 
      ELSE NULL 
    END;
  ELSE
    RAISE NOTICE 'course_completions.course_id is already bigint or different type';
  END IF;
END $$;

-- Convert competitions.course_id from text to bigint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
      AND table_name = 'competitions' 
      AND column_name = 'course_id'
      AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Converting competitions.course_id from text to bigint';
    ALTER TABLE "competitions" 
    ALTER COLUMN "course_id" TYPE bigint USING CASE 
      WHEN "course_id" ~ '^[0-9]+$' THEN "course_id"::bigint 
      ELSE NULL 
    END;
  ELSE
    RAISE NOTICE 'competitions.course_id is already bigint or different type';
  END IF;
END $$;

-- Verify the changes
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('course_completions', 'competitions')
  AND column_name = 'course_id'
ORDER BY table_name;

