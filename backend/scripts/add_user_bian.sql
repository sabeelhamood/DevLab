-- Test script to add a user to userProfiles table with learner_name = "bian"
-- This script can be run directly in Supabase SQL Editor
-- It uses the same SQL structure as migrations

-- Check if user with learner_name = "bian" already exists
DO $$
DECLARE
  existing_learner_id uuid;
  new_learner_id uuid;
BEGIN
  -- Check if user already exists
  SELECT "learner_id" INTO existing_learner_id
  FROM "userProfiles"
  WHERE "learner_name" = 'bian'
  LIMIT 1;

  IF existing_learner_id IS NOT NULL THEN
    RAISE NOTICE '⚠️ User with learner_name = "bian" already exists';
    RAISE NOTICE '   learner_id: %', existing_learner_id;
    RAISE NOTICE '   learner_name: bian';
    RAISE NOTICE '✅ Test completed - user already exists';
  ELSE
    -- Generate new UUID for learner_id
    new_learner_id := gen_random_uuid();
    
    -- Insert new user with learner_name = "bian"
    INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
    VALUES (new_learner_id, 'bian', now(), now());
    
    RAISE NOTICE '✅ User successfully added to userProfiles';
    RAISE NOTICE '   learner_id: %', new_learner_id;
    RAISE NOTICE '   learner_name: bian';
    RAISE NOTICE '   created_at: %', now();
    RAISE NOTICE '   updated_at: %', now();
    
    -- Verify the insertion
    SELECT "learner_id" INTO existing_learner_id
    FROM "userProfiles"
    WHERE "learner_id" = new_learner_id;
    
    IF existing_learner_id IS NOT NULL THEN
      RAISE NOTICE '✅ Verification successful - user found in database';
    ELSE
      RAISE EXCEPTION '❌ Verification failed - user not found after insertion';
    END IF;
  END IF;
END $$;

-- Query to verify the user was added (run this separately if needed)
SELECT 
  "learner_id",
  "learner_name",
  "created_at",
  "updated_at"
FROM "userProfiles"
WHERE "learner_name" = 'bian'
ORDER BY "created_at" DESC
LIMIT 1;

