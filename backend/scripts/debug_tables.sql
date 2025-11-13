-- ============================================================================
-- Debug Script: Check Current State of Tables
-- ============================================================================

-- Check userProfiles
SELECT 
    'userProfiles' as table_name,
    COUNT(*) as row_count
FROM "userProfiles";

SELECT 
    'First 5 users' as info,
    "learner_id",
    "learner_name",
    "created_at"
FROM "userProfiles"
ORDER BY "created_at"
LIMIT 5;

-- Check course_completions
SELECT 
    'course_completions' as table_name,
    COUNT(*) as row_count
FROM "course_completions";

SELECT 
    'All course completions' as info,
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
ORDER BY cc."completed_at" DESC;

-- Check competitions
SELECT 
    'competitions' as table_name,
    COUNT(*) as row_count
FROM "competitions";

SELECT 
    'All competitions' as info,
    "competition_id",
    "course_name",
    "course_id",
    "learner1_id",
    "learner2_id",
    "status",
    "created_at"
FROM "competitions"
ORDER BY "created_at" DESC;


