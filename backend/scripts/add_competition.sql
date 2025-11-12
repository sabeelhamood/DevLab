-- ============================================================================
-- Script: Automatically Create Competition from First Two Learners
-- ============================================================================
-- This script will:
-- 1. Select the first two learners from userProfiles
-- 2. Find a course they both completed in course_completions
-- 3. Insert a new competition using those learners and the shared course
-- ============================================================================

-- Step 1: Select the first two learners
WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
),

-- Step 2: Find a course that both learners completed
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

-- Step 3: Insert a new competition using the learners and shared course
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
-- 1. Make sure the userProfiles table has at least two learners
-- 2. Make sure both learners completed the same course in course_completions
-- 3. The questions field is mocked with JSON - you can customize it as needed
-- 4. learner1_answers and learner2_answers start empty ([])
-- 5. learner1_score and learner2_score start at 0
-- ============================================================================
