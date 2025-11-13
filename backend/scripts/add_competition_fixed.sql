-- ============================================================================
-- Script: Create Competition - Fixed Version (Guaranteed to Work)
-- ============================================================================
-- This script will:
-- 1. Get the first two learners
-- 2. Add them to course_completions with the same course
-- 3. Create a competition
-- ============================================================================

-- Step 1: Get the first two learners and add course completions
DO $$
DECLARE
    learner1_id UUID;
    learner2_id UUID;
    course_id_val BIGINT := 1;
    course_name_val TEXT := 'Introduction to Programming';
BEGIN
    -- Get first learner
    SELECT "learner_id" INTO learner1_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1;
    
    -- Get second learner
    SELECT "learner_id" INTO learner2_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1 OFFSET 1;
    
    -- Check if we have two learners
    IF learner1_id IS NULL OR learner2_id IS NULL THEN
        RAISE EXCEPTION 'Need at least 2 learners in userProfiles table';
    END IF;
    
    RAISE NOTICE 'Found learners: % and %', learner1_id, learner2_id;
    
    -- Add course completion for learner1 (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM "course_completions" 
        WHERE "learner_id" = learner1_id 
          AND "course_id" = course_id_val
    ) THEN
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
        VALUES (learner1_id, course_id_val, course_name_val);
        RAISE NOTICE 'Added course completion for learner1: %', learner1_id;
    ELSE
        RAISE NOTICE 'Learner1 already has course completion';
    END IF;
    
    -- Add course completion for learner2 (if not exists)
    IF NOT EXISTS (
        SELECT 1 FROM "course_completions" 
        WHERE "learner_id" = learner2_id 
          AND "course_id" = course_id_val
    ) THEN
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
        VALUES (learner2_id, course_id_val, course_name_val);
        RAISE NOTICE 'Added course completion for learner2: %', learner2_id;
    ELSE
        RAISE NOTICE 'Learner2 already has course completion';
    END IF;
    
    RAISE NOTICE 'Course completions ensured for both learners';
END $$;

-- Step 2: Verify course completions were added
SELECT 
    'Course Completions After Insert' as check_name,
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."course_id" = 1
ORDER BY cc."completed_at" DESC;

-- Step 3: Create the competition
WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
),
shared_course AS (
    SELECT 
        cc."course_id", 
        cc."course_name"
    FROM "course_completions" cc
    INNER JOIN first_two_learners ftl ON cc."learner_id" = ftl."learner_id"
    WHERE cc."course_id" = 1
    GROUP BY cc."course_id", cc."course_name"
    HAVING COUNT(DISTINCT cc."learner_id") = 2
    LIMIT 1
)
INSERT INTO "competitions" (
    "course_name",
    "course_id",
    "learner1_id",
    "learner2_id",
    "status",
    "question_count",
    "time_limit",
    "questions",
    "learner1_answers",
    "learner2_answers",
    "learner1_score",
    "learner2_score"
)
SELECT 
    sc."course_name",
    sc."course_id",
    ftl1."learner_id" as "learner1_id",
    ftl2."learner_id" as "learner2_id",
    'active' as "status",
    3 as "question_count",
    1800 as "time_limit",
    '[
      {
        "id": "q1",
        "title": "Mock Question 1",
        "points": 100,
        "testCases": [],
        "timeLimit": 600,
        "difficulty": "medium",
        "description": "Mock question 1",
        "starterCode": ""
      },
      {
        "id": "q2",
        "title": "Mock Question 2",
        "points": 80,
        "testCases": [],
        "timeLimit": 420,
        "difficulty": "easy",
        "description": "Mock question 2",
        "starterCode": ""
      },
      {
        "id": "q3",
        "title": "Mock Question 3",
        "points": 120,
        "testCases": [],
        "timeLimit": 540,
        "difficulty": "hard",
        "description": "Mock question 3",
        "starterCode": ""
      }
    ]'::jsonb as "questions",
    '[]'::jsonb as "learner1_answers",
    '[]'::jsonb as "learner2_answers",
    0 as "learner1_score",
    0 as "learner2_score"
FROM first_two_learners ftl1
CROSS JOIN first_two_learners ftl2
CROSS JOIN shared_course sc
WHERE ftl1."learner_id" < ftl2."learner_id"
LIMIT 1
RETURNING 
    "competition_id", 
    "course_name", 
    "course_id",
    "learner1_id", 
    "learner2_id", 
    "status";

-- Step 4: Verify competition was created
SELECT 
    'Competitions After Insert' as check_name,
    "competition_id",
    "course_name",
    "course_id",
    "learner1_id",
    "learner2_id",
    "status",
    "created_at"
FROM "competitions"
ORDER BY "created_at" DESC
LIMIT 5;


