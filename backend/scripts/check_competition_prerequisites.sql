-- ============================================================================
-- Diagnostic Script: Check Prerequisites for Competition Creation
-- ============================================================================
-- This script helps you identify why competitions aren't being created
-- ============================================================================

-- Check 1: How many learners exist?
SELECT 
    'Learners in userProfiles' as check_name,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✓ PASS - At least 2 learners exist'
        ELSE '✗ FAIL - Need at least 2 learners'
    END as status
FROM "userProfiles";

-- Check 2: Show the first two learners
SELECT 
    'First two learners' as check_name,
    "learner_id",
    "learner_name",
    "created_at"
FROM "userProfiles"
ORDER BY "created_at"
LIMIT 2;

-- Check 3: How many course completions exist?
SELECT 
    'Course completions count' as check_name,
    COUNT(*) as total_completions,
    COUNT(DISTINCT "learner_id") as unique_learners,
    COUNT(DISTINCT "course_id") as unique_courses
FROM "course_completions";

-- Check 4: Show all course completions
SELECT 
    'All course completions' as check_name,
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
ORDER BY cc."completed_at" DESC;

-- Check 5: Find shared courses (courses completed by both of the first two learners)
WITH first_two_learners AS (
    SELECT "learner_id", "learner_name"
    FROM "userProfiles"
    ORDER BY "created_at"
    LIMIT 2
)
SELECT 
    'Shared courses check' as check_name,
    cc."course_id",
    cc."course_name",
    COUNT(DISTINCT cc."learner_id") as learners_completed,
    STRING_AGG(DISTINCT ftl."learner_name", ', ') as learner_names,
    CASE 
        WHEN COUNT(DISTINCT cc."learner_id") = 2 THEN '✓ PASS - Both learners completed this course'
        ELSE '✗ FAIL - Not completed by both learners'
    END as status
FROM "course_completions" cc
INNER JOIN first_two_learners ftl ON cc."learner_id" = ftl."learner_id"
GROUP BY cc."course_id", cc."course_name"
ORDER BY learners_completed DESC;

-- Check 6: Show what the INSERT query would find
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
SELECT 
    'What INSERT query would use' as check_name,
    ftl1."learner_id" as learner1_id,
    ftl1."learner_name" as learner1_name,
    ftl2."learner_id" as learner2_id,
    ftl2."learner_name" as learner2_name,
    sc."course_id",
    sc."course_name",
    CASE 
        WHEN sc."course_id" IS NOT NULL THEN '✓ READY - Can create competition'
        ELSE '✗ NOT READY - No shared course found'
    END as status
FROM first_two_learners ftl1
CROSS JOIN first_two_learners ftl2
LEFT JOIN shared_course sc ON true
WHERE ftl1."learner_id" < ftl2."learner_id"
LIMIT 1;

