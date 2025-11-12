-- Quick SQL script to check competitions in the database
-- Run this in Supabase SQL Editor to see all competitions

-- Check all competitions
SELECT 
  "competition_id",
  "course_name",
  "course_id",
  "learner1_id",
  "learner2_id",
  "status",
  "question_count",
  "learner1_score",
  "learner2_score",
  "created_at",
  "updated_at"
FROM "competitions"
ORDER BY "created_at" DESC
LIMIT 10;

-- Count total competitions
SELECT COUNT(*) as total_competitions FROM "competitions";

-- Check users available for competitions
SELECT 
  "learner_id",
  "learner_name",
  "created_at"
FROM "userProfiles"
ORDER BY "created_at"
LIMIT 10;

