-- ============================================================================
-- Script: Add Shared Course Completion for First Two Learners
-- ============================================================================
-- This script adds a course completion record for both of the first two learners
-- so they can compete on a shared course
-- ============================================================================

-- Get the first two learners
WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
)
-- Insert course completion for both learners (using course_id = 1 as default)
INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
SELECT 
    ftl."learner_id",
    1 as "course_id",
    'Introduction to Programming' as "course_name"
FROM first_two_learners ftl
WHERE NOT EXISTS (
    -- Only insert if this learner hasn't already completed this course
    SELECT 1 
    FROM "course_completions" cc 
    WHERE cc."learner_id" = ftl."learner_id" 
      AND cc."course_id" = 1
)
RETURNING 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at";

-- Verify the insert
SELECT 
    'Verification: Course completions for first two learners' as check_name,
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
      ORDER BY "created_at" 
      LIMIT 2
  )
ORDER BY cc."completed_at" DESC;

