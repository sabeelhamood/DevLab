-- ============================================================================
-- Script: Create Competition with Fallback (Creates data if missing)
-- ============================================================================
-- This script will:
-- 1. Check if two learners exist, create them if needed
-- 2. Check if they have a shared course, create one if needed
-- 3. Insert a new competition
-- ============================================================================

-- Step 1: Ensure we have at least two learners
DO $$
DECLARE
    learner_count INTEGER;
    learner1_id UUID;
    learner2_id UUID;
BEGIN
    -- Count existing learners
    SELECT COUNT(*) INTO learner_count FROM "userProfiles";
    
    -- If less than 2 learners, create them
    IF learner_count < 2 THEN
        -- Create first learner if doesn't exist
        INSERT INTO "userProfiles" ("learner_id", "learner_name")
        VALUES 
            ('00000000-0000-0000-0000-000000000001', 'Learner One')
        ON CONFLICT ("learner_id") DO NOTHING;
        
        -- Create second learner if doesn't exist
        INSERT INTO "userProfiles" ("learner_id", "learner_name")
        VALUES 
            ('00000000-0000-0000-0000-000000000002', 'Learner Two')
        ON CONFLICT ("learner_id") DO NOTHING;
        
        RAISE NOTICE 'Created learners if they did not exist';
    END IF;
    
    -- Get the first two learners
    SELECT "learner_id" INTO learner1_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1;
    
    SELECT "learner_id" INTO learner2_id 
    FROM "userProfiles" 
    ORDER BY "created_at" 
    LIMIT 1 OFFSET 1;
    
    -- Step 2: Ensure both learners have completed the same course
    IF NOT EXISTS (
        SELECT 1
        FROM "course_completions" cc1
        INNER JOIN "course_completions" cc2 
            ON cc1."course_id" = cc2."course_id" 
            AND cc1."course_name" = cc2."course_name"
        WHERE cc1."learner_id" = learner1_id
          AND cc2."learner_id" = learner2_id
    ) THEN
        -- Create a shared course completion for both learners
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name")
        VALUES 
            (learner1_id, 1, 'Introduction to Programming'),
            (learner2_id, 1, 'Introduction to Programming')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created shared course completion for both learners';
    END IF;
END $$;

-- Step 3: Now insert the competition
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

