-- ============================================================================
-- IMPROVED TEST SCRIPT: Add New Test Learner and Course Completion
-- ============================================================================
-- This script includes all safety checks and verifications:
-- 1. Ensures pgcrypto extension is available
-- 2. Tests connection and permissions
-- 3. Creates test learner with unique UUID and timestamped name
-- 4. Adds course completion with duplicate prevention
-- 5. Comprehensive verification steps
-- 
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 0: Pre-flight Checks
-- ============================================================================

-- 0.1: Ensure pgcrypto extension is installed (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0.2: Test connection - verify we can query the database
SELECT 
    'Connection Test' as check_type,
    version() as postgresql_version,
    current_database() as database_name,
    current_user as connected_user,
    now() as current_timestamp;

-- 0.3: Check permissions on userProfiles table
SELECT 
    'Permission Check: userProfiles' as check_type,
    has_table_privilege(current_user, 'userProfiles', 'SELECT') as can_select,
    has_table_privilege(current_user, 'userProfiles', 'INSERT') as can_insert,
    has_table_privilege(current_user, 'userProfiles', 'UPDATE') as can_update;

-- 0.4: Check permissions on course_completions table
SELECT 
    'Permission Check: course_completions' as check_type,
    has_table_privilege(current_user, 'course_completions', 'SELECT') as can_select,
    has_table_privilege(current_user, 'course_completions', 'INSERT') as can_insert,
    has_table_privilege(current_user, 'course_completions', 'UPDATE') as can_update;

-- 0.5: Check RLS status on both tables
SELECT 
    'RLS Status Check' as check_type,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '⚠️ RLS is ENABLED - Service role should bypass'
        ELSE '✅ RLS is DISABLED - No policies apply'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('userProfiles', 'course_completions')
ORDER BY tablename;

-- ============================================================================
-- STEP 1: Generate UUID and Insert New Test Learner
-- ============================================================================

DO $$
DECLARE
    test_learner_id uuid;
    test_learner_name text;
    insertion_success boolean := false;
BEGIN
    -- Generate a new UUID using pgcrypto extension
    test_learner_id := gen_random_uuid();
    
    -- Create a unique test learner name with timestamp
    test_learner_name := 'Test Learner ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
    
    RAISE NOTICE '🔍 Attempting to insert test learner...';
    RAISE NOTICE '   Generated UUID: %', test_learner_id;
    RAISE NOTICE '   Learner Name: %', test_learner_name;
    
    -- Insert the test learner with ON CONFLICT to prevent duplicate UUIDs
    INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
    VALUES (
        test_learner_id::uuid,
        test_learner_name::text,
        now(),
        now()
    )
    ON CONFLICT ("learner_id") DO NOTHING
    RETURNING "learner_id", "learner_name" INTO test_learner_id, test_learner_name;
    
    -- Check if insertion was successful
    IF test_learner_id IS NOT NULL THEN
        insertion_success := true;
        RAISE NOTICE '✅ Test learner inserted successfully';
        RAISE NOTICE '   Learner ID: %', test_learner_id;
        RAISE NOTICE '   Learner Name: %', test_learner_name;
    ELSE
        RAISE NOTICE '⚠️ Test learner UUID already exists, skipping insertion';
    END IF;
    
    -- ============================================================================
    -- STEP 2: Insert Course Completion for Test Learner
    -- ============================================================================
    
    IF insertion_success THEN
        RAISE NOTICE '🔍 Attempting to insert course completion...';
        
        -- Insert course completion with duplicate prevention
        -- Uses WHERE NOT EXISTS to check for learner_id + course_id combination
        INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
        SELECT 
            test_learner_id::uuid,
            1::bigint,
            'Introduction to Programming'::text,
            now()
        WHERE NOT EXISTS (
            SELECT 1 
            FROM "course_completions" 
            WHERE "learner_id" = test_learner_id::uuid
              AND "course_id" = 1::bigint
        );
        
        -- Check if insertion was successful
        IF FOUND THEN
            RAISE NOTICE '✅ Course completion inserted successfully';
            RAISE NOTICE '   Learner ID: %', test_learner_id;
            RAISE NOTICE '   Course ID: 1';
            RAISE NOTICE '   Course Name: Introduction to Programming';
        ELSE
            RAISE NOTICE '⚠️ Course completion already exists for this learner and course';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Skipping course completion insertion - learner was not inserted';
    END IF;
    
END $$;

-- ============================================================================
-- STEP 3: Comprehensive Verification Queries
-- ============================================================================

-- 3.1: Verify Test Learner Was Inserted
SELECT 
    '✅ Verification 3.1: Test Learner' as verification_step,
    "learner_id",
    "learner_name",
    "created_at",
    "updated_at",
    CASE 
        WHEN "learner_id" IS NOT NULL THEN '✅ Learner found'
        ELSE '❌ Learner not found'
    END as status
FROM "userProfiles"
WHERE "learner_name" LIKE 'Test Learner%'
ORDER BY "created_at" DESC
LIMIT 1;

-- 3.2: Verify Course Completion Was Inserted
SELECT 
    '✅ Verification 3.2: Course Completion' as verification_step,
    cc."learner_id",
    up."learner_name",
    cc."course_id",
    cc."course_name",
    cc."completed_at",
    CASE 
        WHEN cc."learner_id" IS NOT NULL THEN '✅ Completion found'
        ELSE '❌ Completion not found'
    END as status
FROM "course_completions" cc
INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE up."learner_name" LIKE 'Test Learner%'
  AND cc."course_id" = 1::bigint
ORDER BY cc."completed_at" DESC
LIMIT 1;

-- 3.3: Check for Duplicates in course_completions
SELECT 
    '✅ Verification 3.3: Duplicate Check' as verification_step,
    "learner_id",
    "course_id",
    COUNT(*) as completion_count,
    CASE 
        WHEN COUNT(*) > 1 THEN '⚠️ DUPLICATE FOUND - Multiple completions for same learner+course'
        WHEN COUNT(*) = 1 THEN '✅ No duplicates - Single completion per learner+course'
        ELSE '❌ No completions found'
    END as duplicate_status
FROM "course_completions"
WHERE "learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
)
GROUP BY "learner_id", "course_id"
HAVING COUNT(*) >= 1;

-- 3.4: Verify Foreign Key Integrity
SELECT 
    '✅ Verification 3.4: Foreign Key Integrity' as verification_step,
    cc."learner_id",
    cc."course_id",
    CASE 
        WHEN up."learner_id" IS NULL THEN '❌ ORPHANED - Foreign key violation!'
        WHEN up."learner_id" IS NOT NULL THEN '✅ Valid - Foreign key OK'
        ELSE '❌ Unknown error'
    END as foreign_key_status,
    up."learner_name" as learner_name
FROM "course_completions" cc
LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
);

-- 3.5: Complete Verification Summary
SELECT 
    '✅ Verification 3.5: Complete Summary' as verification_step,
    COUNT(DISTINCT up."learner_id") as test_learners_found,
    COUNT(DISTINCT cc."learner_id") as learners_with_completions,
    COUNT(cc."course_id") as total_completions,
    CASE 
        WHEN COUNT(DISTINCT up."learner_id") = COUNT(DISTINCT cc."learner_id") 
             AND COUNT(DISTINCT up."learner_id") > 0
             AND COUNT(cc."course_id") = COUNT(DISTINCT up."learner_id")
        THEN '✅ SUCCESS - All test learners have completions, no duplicates'
        WHEN COUNT(DISTINCT up."learner_id") = 0
        THEN '❌ FAILED - No test learners found'
        WHEN COUNT(DISTINCT up."learner_id") > COUNT(DISTINCT cc."learner_id")
        THEN '⚠️ WARNING - Some test learners missing completions'
        WHEN COUNT(cc."course_id") > COUNT(DISTINCT up."learner_id")
        THEN '⚠️ WARNING - Possible duplicates detected'
        ELSE '⚠️ WARNING - Unexpected state'
    END as overall_status
FROM "userProfiles" up
LEFT JOIN "course_completions" cc ON up."learner_id" = cc."learner_id" AND cc."course_id" = 1::bigint
WHERE up."learner_name" LIKE 'Test Learner%';

-- ============================================================================
-- STEP 4: Data Type Verification
-- ============================================================================

SELECT 
    '✅ Verification 4: Data Type Check' as verification_step,
    pg_typeof(up."learner_id") as learner_id_type,
    pg_typeof(cc."course_id") as course_id_type,
    pg_typeof(cc."course_name") as course_name_type,
    pg_typeof(cc."completed_at") as completed_at_type,
    CASE 
        WHEN pg_typeof(up."learner_id")::text = 'uuid' 
             AND pg_typeof(cc."course_id")::text = 'bigint'
             AND pg_typeof(cc."course_name")::text = 'text'
             AND pg_typeof(cc."completed_at")::text LIKE '%timestamp%'
        THEN '✅ All data types correct'
        ELSE '⚠️ Data type mismatch detected'
    END as type_status
FROM "userProfiles" up
INNER JOIN "course_completions" cc ON up."learner_id" = cc."learner_id"
WHERE up."learner_name" LIKE 'Test Learner%'
LIMIT 1;

