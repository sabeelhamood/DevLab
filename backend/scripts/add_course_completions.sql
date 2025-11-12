-- ============================================================================
-- Script: Add Course Completions for All Users
-- ============================================================================
-- This script adds a course completion record for each user in userProfiles
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Insert course completions for all users
-- Default: course_id = 1, course_name = 'Introduction to Programming'
-- You can modify these values below
INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
SELECT 
    up."learner_id",
    1 as "course_id",  -- Change this to your desired course_id
    'Introduction to Programming' as "course_name",  -- Change this to your desired course_name
    now() as "completed_at"
FROM "userProfiles" up
WHERE NOT EXISTS (
    -- Only insert if this learner hasn't already completed this course
    SELECT 1 
    FROM "course_completions" cc 
    WHERE cc."learner_id" = up."learner_id" 
      AND cc."course_id" = 1  -- Change this to match the course_id above
)
RETURNING 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at";

-- Verify the insert
SELECT 
    'Verification: Course completions added' as check_name,
    COUNT(*) as total_completions,
    COUNT(DISTINCT "learner_id") as unique_learners
FROM "course_completions"
WHERE "course_id" = 1;  -- Change this to match the course_id above

-- Show all course completions
SELECT 
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."course_id" = 1  -- Change this to match the course_id above
ORDER BY cc."completed_at" DESC;

