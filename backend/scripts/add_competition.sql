-- ============================================================================
-- Script: Automatically Create Competition from First Two Learners
-- ============================================================================
-- This script will:
-- 1. Select the first two learners from userProfiles
-- 2. Ensure both learners have completed the same course (add to course_completions if needed)
-- 3. Insert a new competition using those learners and the shared course
-- ============================================================================

-- Step 1: Ensure both learners have a shared course completion
DO $$
DECLARE
    learner1_id UUID;
    learner2_id UUID;
    shared_course_id BIGINT := 1;  -- Default course_id
    shared_course_name TEXT := 'Introduction to Programming';  -- Default course name
    existing_shared_course_id BIGINT;
    existing_shared_course_name TEXT;
BEGIN
    -- Get the first two learners
    SELECT "learner_id" INTO learner1_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1;
    
    SELECT "learner_id" INTO learner2_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1 OFFSET 1;
    
    -- Check if there's already a shared course
    SELECT cc."course_id", cc."course_name" 
    INTO existing_shared_course_id, existing_shared_course_name
    FROM "course_completions" cc
    WHERE cc."learner_id" = learner1_id
      AND EXISTS (
          SELECT 1 FROM "course_completions" cc2
          WHERE cc2."learner_id" = learner2_id
            AND cc2."course_id" = cc."course_id"
            AND cc2."course_name" = cc."course_name"
      )
    LIMIT 1;
    
    -- Use existing shared course if found, otherwise use default
    IF existing_shared_course_id IS NOT NULL THEN
        shared_course_id := existing_shared_course_id;
        shared_course_name := existing_shared_course_name;
    END IF;
    
    -- Ensure learner1 has this course completion (only if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM "course_completions" 
        WHERE "learner_id" = learner1_id 
          AND "course_id" = shared_course_id
    ) THEN
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
        VALUES (learner1_id, shared_course_id, shared_course_name);
    END IF;
    
    -- Ensure learner2 has this course completion (only if doesn't exist)
    IF NOT EXISTS (
        SELECT 1 FROM "course_completions" 
        WHERE "learner_id" = learner2_id 
          AND "course_id" = shared_course_id
    ) THEN
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
        VALUES (learner2_id, shared_course_id, shared_course_name);
    END IF;
    
    RAISE NOTICE 'Ensured both learners have course completion for course_id: %, course_name: %', shared_course_id, shared_course_name;
END $$;

-- Step 2: Select the first two learners
WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
),

-- Step 3: Find the shared course (should exist now after the DO block)
shared_course AS (
    SELECT 
        cc."course_id", 
        cc."course_name"
    FROM "course_completions" cc
    INNER JOIN first_two_learners ftl ON cc."learner_id" = ftl."learner_id"
    GROUP BY cc."course_id", cc."course_name"
    HAVING COUNT(DISTINCT cc."learner_id") = 2  -- Both learners completed this course
    LIMIT 1
)

-- Step 4: Insert a new competition using the learners and shared course
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
WHERE ftl1."learner_id" < ftl2."learner_id"  -- Ensure we get a unique pair (learner1 < learner2)
  AND EXISTS (SELECT 1 FROM shared_course)  -- Ensure a shared course exists
LIMIT 1
RETURNING 
    "competition_id", 
    "course_name", 
    "course_id",
    "learner1_id", 
    "learner2_id", 
    "status";

-- ============================================================================
-- Notes / Instructions:
-- ============================================================================
-- 1. This script automatically ensures both learners have a shared course completion
-- 2. If no shared course exists, it creates one with course_id=1 and name='Introduction to Programming'
-- 3. The questions field is mocked with JSON - you can customize it as needed
-- 4. learner1_answers and learner2_answers start empty ([])
-- 5. learner1_score and learner2_score start at 0
-- ============================================================================
