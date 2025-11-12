-- ============================================================================
-- Script: Add Course Completions for First Two Learners Only
-- ============================================================================
-- This script adds a course completion record for ONLY the first two learners
-- from userProfiles table, ordered by created_at
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert course completions for the first two learners only
INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
SELECT 
    first_two."learner_id",
    1::bigint as "course_id",
    'Introduction to Programming'::text as "course_name",
    now() as "completed_at"
FROM (
    SELECT "learner_id"
    FROM "userProfiles"
    ORDER BY "created_at" ASC
    LIMIT 2
) AS first_two
WHERE NOT EXISTS (
    -- Only insert if this learner hasn't already completed this course
    SELECT 1 
    FROM "course_completions" cc 
    WHERE cc."learner_id" = first_two."learner_id" 
      AND cc."course_id" = 1
)
RETURNING 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at";

-- Step 2: Verify insertion - should show exactly 2 rows
SELECT 
    'Verification: Course completions for first two learners' as check_name,
    COUNT(*) as total_completions,
    COUNT(DISTINCT "learner_id") as unique_learners
FROM "course_completions"
WHERE "course_id" = 1
  AND "learner_id" IN (
      SELECT "learner_id" 
      FROM "userProfiles" 
      ORDER BY "created_at" ASC 
      LIMIT 2
  );

-- Step 3: Show the inserted rows with learner names
SELECT 
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."course_id" = 1
  AND cc."learner_id" IN (
      SELECT "learner_id" 
      FROM "userProfiles" 
      ORDER BY "created_at" ASC 
      LIMIT 2
  )
ORDER BY cc."completed_at" DESC;

