-- Simple SQL script to add a user with learner_name = "bian"
-- Run this in Supabase SQL Editor
-- This script checks if the user exists first, then inserts if not found

-- Insert user only if it doesn't already exist
INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
SELECT 
  gen_random_uuid(),
  'bian',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM "userProfiles" WHERE "learner_name" = 'bian'
)
RETURNING "learner_id", "learner_name", "created_at", "updated_at";

-- Verify the user exists (this will show the user if it was just added or if it already existed)
SELECT 
  "learner_id",
  "learner_name",
  "created_at",
  "updated_at"
FROM "userProfiles"
WHERE "learner_name" = 'bian'
ORDER BY "created_at" DESC
LIMIT 1;

