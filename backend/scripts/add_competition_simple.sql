-- ============================================================================
-- Script: Create Competition (Simplified - Works without course completions)
-- ============================================================================
-- This script creates a competition using the first two learners
-- It will use a default course if no shared course completion exists
-- ============================================================================

WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
),
-- Try to find a shared course, or use a default
shared_course AS (
    SELECT 
        cc."course_id", 
        cc."course_name"
    FROM "course_completions" cc
    INNER JOIN first_two_learners ftl ON cc."learner_id" = ftl."learner_id"
    GROUP BY cc."course_id", cc."course_name"
    HAVING COUNT(DISTINCT cc."learner_id") = 2
    LIMIT 1
),
-- Fallback to default course if no shared course found
default_course AS (
    SELECT 
        COALESCE(
            (SELECT "course_id" FROM shared_course LIMIT 1),
            1  -- Default course_id
        ) as "course_id",
        COALESCE(
            (SELECT "course_name" FROM shared_course LIMIT 1),
            'Introduction to Programming'  -- Default course name
        ) as "course_name"
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
    dc."course_name",
    dc."course_id",
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
CROSS JOIN default_course dc
WHERE ftl1."learner_id" < ftl2."learner_id"  -- Ensure we get a unique pair
LIMIT 1
RETURNING 
    "competition_id", 
    "course_name", 
    "course_id",
    "learner1_id", 
    "learner2_id", 
    "status";

