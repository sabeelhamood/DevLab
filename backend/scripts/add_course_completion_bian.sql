-- SQL script to add course completion for learner "bian"
-- Learner ID: 0b51b923-1e6d-4f46-a4d0-7a3d0a701a94
-- Course ID: 2
-- Course Name: c++ Programming

-- Step 1: Check if learner exists
SELECT 
    "learner_id",
    "learner_name",
    "created_at",
    "updated_at"
FROM "userProfiles"
WHERE "learner_id" = '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid;

-- Step 2: Check if course completion already exists
SELECT 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at"
FROM "course_completions"
WHERE "learner_id" = '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid
  AND "course_id" = 2::bigint
ORDER BY "completed_at" DESC
LIMIT 1;

-- Step 3: Insert course completion (only if it doesn't exist)
INSERT INTO "course_completions" (
    "learner_id",
    "course_id",
    "course_name",
    "completed_at"
)
SELECT 
    '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid,
    2::bigint,
    'c++ Programming'::text,
    now()
WHERE NOT EXISTS (
    SELECT 1
    FROM "course_completions"
    WHERE "learner_id" = '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid
      AND "course_id" = 2::bigint
      AND "course_name" = 'c++ Programming'::text
)
RETURNING 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at";

-- Step 4: Verify the insertion
SELECT 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at"
FROM "course_completions"
WHERE "learner_id" = '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid
  AND "course_id" = 2::bigint
ORDER BY "completed_at" DESC;

-- Step 5: Get all course completions for this learner
SELECT 
    "learner_id",
    "course_id",
    "course_name",
    "completed_at"
FROM "course_completions"
WHERE "learner_id" = '0b51b923-1e6d-4f46-a4d0-7a3d0a701a94'::uuid
ORDER BY "completed_at" DESC;


















