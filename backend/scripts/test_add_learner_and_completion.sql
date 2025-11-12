-- ============================================================================
-- TEST SCRIPT: Add New Test Learner and Course Completion
-- ============================================================================
-- This script tests the Supabase connection and insertion process by:
-- 1. Creating a new test learner in userProfiles
-- 2. Adding a course completion for that learner
-- 3. Verifying both insertions were successful
-- 
-- Run this in Supabase SQL Editor to test the connection and insertion process
-- ============================================================================

-- ============================================================================
-- STEP 1: Generate UUID and Insert New Test Learner
-- ============================================================================
-- Generate a UUID and insert a new test learner
-- Uses ON CONFLICT to prevent errors if UUID already exists
-- ============================================================================

DO $$
DECLARE
    test_learner_id uuid;
    test_learner_name text;
BEGIN
    -- Generate a new UUID for the test learner
    test_learner_id := gen_random_uuid();
    
    -- Create a unique test learner name with timestamp
    test_learner_name := 'Test Learner ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
    
    -- Insert the test learner
    INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
    VALUES (test_learner_id, test_learner_name, now(), now())
    ON CONFLICT ("learner_id") DO NOTHING
    RETURNING "learner_id", "learner_name" INTO test_learner_id, test_learner_name;
    
    -- Display the inserted learner information
    RAISE NOTICE '✅ Test learner created:';
    RAISE NOTICE '   Learner ID: %', test_learner_id;
    RAISE NOTICE '   Learner Name: %', test_learner_name;
    
    -- ============================================================================
    -- STEP 2: Insert Course Completion for Test Learner
    -- ============================================================================
    -- Insert course completion with duplicate prevention
    -- Uses WHERE NOT EXISTS to avoid inserting if completion already exists
    -- ============================================================================
    
    INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
    SELECT 
        test_learner_id,
        1::bigint,
        'Introduction to Programming'::text,
        now()
    WHERE NOT EXISTS (
        SELECT 1 
        FROM "course_completions" 
        WHERE "learner_id" = test_learner_id
          AND "course_id" = 1
    );
    
    -- Check if insertion was successful
    IF FOUND THEN
        RAISE NOTICE '✅ Course completion added for test learner';
    ELSE
        RAISE NOTICE '⚠️ Course completion already exists for this learner and course';
    END IF;
    
END $$;

-- ============================================================================
-- STEP 3: Verification Queries
-- ============================================================================
-- Run these queries to verify the test learner and completion were added
-- ============================================================================

-- 3.1: Verify Test Learner Was Added
SELECT 
    'Step 3.1: Test Learner Verification' as verification_step,
    "learner_id",
    "learner_name",
    "created_at",
    "updated_at"
FROM "userProfiles"
WHERE "learner_name" LIKE 'Test Learner%'
ORDER BY "created_at" DESC
LIMIT 1;

-- 3.2: Verify Course Completion Was Added
SELECT 
    'Step 3.2: Course Completion Verification' as verification_step,
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at"
FROM "course_completions" cc
INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE up."learner_name" LIKE 'Test Learner%'
  AND cc."course_id" = 1
ORDER BY cc."completed_at" DESC
LIMIT 1;

-- 3.3: Verify No Duplicates
SELECT 
    'Step 3.3: Duplicate Check' as verification_step,
    "learner_id",
    "course_id",
    COUNT(*) as completion_count,
    CASE 
        WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATE FOUND'
        ELSE '✅ No duplicates'
    END as status
FROM "course_completions"
WHERE "learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
)
GROUP BY "learner_id", "course_id";

-- 3.4: Verify Foreign Key Constraint
SELECT 
    'Step 3.4: Foreign Key Verification' as verification_step,
    cc."learner_id",
    CASE 
        WHEN up."learner_id" IS NULL THEN '❌ ORPHANED - Foreign key violation!'
        ELSE '✅ Valid - Foreign key OK'
    END as foreign_key_status
FROM "course_completions" cc
LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
);

-- 3.5: Complete Verification Summary
SELECT 
    'Step 3.5: Complete Verification Summary' as verification_step,
    COUNT(DISTINCT up."learner_id") as test_learners_found,
    COUNT(DISTINCT cc."learner_id") as learners_with_completions,
    COUNT(cc."course_id") as total_completions,
    CASE 
        WHEN COUNT(DISTINCT up."learner_id") = COUNT(DISTINCT cc."learner_id") 
             AND COUNT(DISTINCT up."learner_id") > 0
        THEN '✅ SUCCESS - All test learners have completions'
        WHEN COUNT(DISTINCT up."learner_id") = 0
        THEN '❌ FAILED - No test learners found'
        ELSE '⚠️ WARNING - Some test learners missing completions'
    END as overall_status
FROM "userProfiles" up
LEFT JOIN "course_completions" cc ON up."learner_id" = cc."learner_id" AND cc."course_id" = 1
WHERE up."learner_name" LIKE 'Test Learner%';

-- ============================================================================
-- OPTIONAL: Cleanup Test Data
-- ============================================================================
-- Uncomment and run these queries ONLY if you want to remove test data
-- ⚠️ WARNING: Do not run on production data!
-- ============================================================================

/*
-- Delete test course completions
DELETE FROM "course_completions"
WHERE "learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
);

-- Delete test learners
DELETE FROM "userProfiles"
WHERE "learner_name" LIKE 'Test Learner%';
*/

