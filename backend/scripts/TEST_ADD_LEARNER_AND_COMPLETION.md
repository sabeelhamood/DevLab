# Test Process: Add New Learner and Course Completion

## Overview
This document explains step-by-step how to test the Supabase connection and insertion process by adding a new test learner and their course completion.

---

## Step 1: Generate UUID for New Learner

### Method 1: Using PostgreSQL (Recommended for SQL Scripts)
```sql
-- PostgreSQL has built-in UUID generation
SELECT gen_random_uuid();
-- Returns: e.g., 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

**How it works:**
- `gen_random_uuid()` is a PostgreSQL function that generates a UUID v4 (random UUID)
- Requires `pgcrypto` extension (already enabled in your schema)
- Returns a standard UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Method 2: Using Node.js (For Scripts)
```javascript
import { randomUUID } from 'node:crypto'
const testLearnerId = randomUUID()
// Returns: e.g., 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

**How it works:**
- Node.js built-in `crypto.randomUUID()` generates UUID v4
- No external dependencies needed
- Compatible with PostgreSQL UUID type

### Method 3: Online UUID Generator
- Use a tool like https://www.uuidgenerator.net/
- Copy the generated UUID
- Ensure it's in the correct format (with hyphens)

### UUID Format Requirements:
- Must be valid UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- 36 characters total (32 hex digits + 4 hyphens)
- Example: `550e8400-e29b-41d4-a716-446655440000`

---

## Step 2: Ensure Connection to Supabase is Correct

### 2.1 Verify SUPABASE_URL Format

**Expected Format:**
```
postgresql://[username]:[password]@[host]:[port]/[database]
```

**Example:**
```
postgresql://postgres.xxxxx:your_password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Connection String Components:**
- `postgresql://` - Protocol
- `username` - Database user (usually `postgres.xxxxx` for Supabase)
- `password` - Database password
- `host` - Supabase host (e.g., `aws-0-us-east-1.pooler.supabase.com`)
- `port` - Port number (usually `6543` for connection pooler or `5432` for direct)
- `database` - Database name (usually `postgres`)

### 2.2 Test Connection (Node.js Script Method)

**Connection Test Query:**
```javascript
// Test connection
const testQuery = await postgres.query('SELECT version()')
console.log('✅ Connected to PostgreSQL:', testQuery.rows[0].version)
```

**Expected Output:**
- Should show PostgreSQL version information
- If this fails, connection string is incorrect

### 2.3 Test Connection (SQL Editor Method)

**In Supabase SQL Editor, run:**
```sql
SELECT version();
SELECT current_database();
SELECT current_user;
```

**Expected Results:**
- `version()` - Shows PostgreSQL version
- `current_database()` - Should show `postgres`
- `current_user` - Should show your database user

### 2.4 SSL Configuration

**For Node.js scripts:**
```javascript
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase
  }
})
```

**Why `rejectUnauthorized: false`:**
- Supabase uses SSL certificates that may not be in Node.js's certificate store
- This setting accepts Supabase's SSL certificate
- Connection is still encrypted, just certificate validation is relaxed

**For SQL Editor:**
- SSL is handled automatically by Supabase
- No manual configuration needed

---

## Step 3: Handle Permissions, SSL, and RLS

### 3.1 Permissions Check

**Check Current User Permissions:**
```sql
-- Check if current user can INSERT into userProfiles
SELECT has_table_privilege(current_user, 'userProfiles', 'INSERT');

-- Check if current user can INSERT into course_completions
SELECT has_table_privilege(current_user, 'course_completions', 'INSERT');

-- Check if current user can SELECT from userProfiles
SELECT has_table_privilege(current_user, 'userProfiles', 'SELECT');
```

**Expected Results:**
- Should return `true` for all three queries
- If `false`, user lacks necessary permissions

### 3.2 Row Level Security (RLS) Check

**Check if RLS is enabled:**
```sql
-- Check RLS status on userProfiles
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'userProfiles';

-- Check RLS status on course_completions
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'course_completions';
```

**Understanding RLS:**
- `rowsecurity = true` - RLS is enabled (policies apply)
- `rowsecurity = false` - RLS is disabled (no policies)

**If RLS is Enabled:**
- Check existing policies:
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('userProfiles', 'course_completions');
```

**RLS Bypass:**
- Service role connections typically bypass RLS
- Direct PostgreSQL connections with service role credentials bypass RLS
- SQL Editor may use service role or your user role (check with `current_user`)

### 3.3 Service Role vs Authenticated User

**Service Role (Bypasses RLS):**
- Used for direct PostgreSQL connections
- Has full database access
- Typically: `postgres.xxxxx` user

**Authenticated User (Subject to RLS):**
- Used for application users
- Subject to RLS policies
- Limited by policies

**For Testing:**
- Use service role connection string to bypass RLS
- This matches how the Node.js script connects

---

## Step 4: Insert Row Safely, Avoiding Duplicates

### 4.1 Insert New Learner into userProfiles

**SQL Statement with Duplicate Prevention:**
```sql
-- Insert new test learner
INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
VALUES (
    '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Replace with generated UUID
    'Test Learner'::text,
    now(),
    now()
)
ON CONFLICT ("learner_id") DO NOTHING
RETURNING "learner_id", "learner_name", "created_at";
```

**Safety Features:**
- `ON CONFLICT DO NOTHING` - Prevents error if UUID already exists
- `RETURNING` clause - Shows what was inserted (or nothing if conflict)
- Explicit type casting (`::uuid`, `::text`) - Ensures correct data types

**Alternative: Check Before Insert**
```sql
-- Check if learner exists first
DO $$
DECLARE
    test_uuid uuid := '550e8400-e29b-41d4-a716-446655440000';
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "userProfiles" WHERE "learner_id" = test_uuid) THEN
        INSERT INTO "userProfiles" ("learner_id", "learner_name")
        VALUES (test_uuid, 'Test Learner');
        RAISE NOTICE 'Learner inserted successfully';
    ELSE
        RAISE NOTICE 'Learner already exists';
    END IF;
END $$;
```

### 4.2 Insert Course Completion for New Learner

**SQL Statement with Duplicate Prevention:**
```sql
-- Insert course completion for test learner
INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
SELECT 
    '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- Replace with test learner UUID
    1::bigint,
    'Introduction to Programming'::text,
    now()
WHERE NOT EXISTS (
    SELECT 1 
    FROM "course_completions" 
    WHERE "learner_id" = '550e8400-e29b-41d4-a716-446655440000'::uuid
      AND "course_id" = 1
)
RETURNING "learner_id", "course_id", "course_name", "completed_at";
```

**Safety Features:**
- `WHERE NOT EXISTS` - Prevents duplicate insertions
- Checks both `learner_id` AND `course_id` combination
- `RETURNING` clause - Shows inserted row (or nothing if duplicate)

**Alternative: Using ON CONFLICT (if primary key allows)**
```sql
-- Note: This won't work with current primary key structure
-- Current PK is (learner_id, course_id, completed_at)
-- So same learner can complete same course multiple times with different timestamps
-- That's why we use WHERE NOT EXISTS instead
```

### 4.3 Complete Test Script (All-in-One)

```sql
-- ============================================================================
-- TEST SCRIPT: Add New Learner and Course Completion
-- ============================================================================

-- Step 1: Generate and store test UUID
DO $$
DECLARE
    test_learner_id uuid := gen_random_uuid();
    test_learner_name text := 'Test Learner ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS');
BEGIN
    -- Step 2: Insert learner (with conflict handling)
    INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
    VALUES (test_learner_id, test_learner_name, now(), now())
    ON CONFLICT ("learner_id") DO NOTHING
    RETURNING "learner_id", "learner_name" INTO test_learner_id, test_learner_name;
    
    -- Step 3: Insert course completion (with duplicate check)
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
    
    -- Step 4: Return results
    RAISE NOTICE 'Test learner ID: %', test_learner_id;
    RAISE NOTICE 'Test learner name: %', test_learner_name;
END $$;

-- Step 5: Verification queries (run separately)
```

---

## Step 5: Verification Steps

### 5.1 Verify Learner Was Added

```sql
-- Find the test learner
SELECT 
    "learner_id",
    "learner_name",
    "created_at",
    "updated_at"
FROM "userProfiles"
WHERE "learner_name" LIKE 'Test Learner%'
ORDER BY "created_at" DESC
LIMIT 1;
```

**Expected Result:**
- Should return exactly 1 row
- `learner_id` should be a valid UUID
- `learner_name` should match your test name
- `created_at` should be recent timestamp

### 5.2 Verify Course Completion Was Added

```sql
-- Find course completion for test learner
SELECT 
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
```

**Expected Result:**
- Should return exactly 1 row
- `learner_id` should match the test learner
- `course_id` should be `1`
- `course_name` should be `'Introduction to Programming'`
- `completed_at` should be recent timestamp

### 5.3 Verify No Duplicates

```sql
-- Check for duplicate completions
SELECT 
    "learner_id",
    "course_id",
    COUNT(*) as completion_count
FROM "course_completions"
WHERE "learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
)
GROUP BY "learner_id", "course_id"
HAVING COUNT(*) > 1;
```

**Expected Result:**
- Should return 0 rows (no duplicates)
- If rows are returned, duplicates exist (investigate)

### 5.4 Verify Foreign Key Constraint

```sql
-- Verify all course_completions have valid learner_id
SELECT 
    cc."learner_id",
    CASE 
        WHEN up."learner_id" IS NULL THEN 'ORPHANED - Foreign key violation!'
        ELSE 'Valid - Foreign key OK'
    END as status
FROM "course_completions" cc
LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
WHERE cc."learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
);
```

**Expected Result:**
- All rows should show `'Valid - Foreign key OK'`
- If `'ORPHANED'` appears, foreign key constraint is violated

### 5.5 Complete Verification Query

```sql
-- Complete verification: Learner + Course Completion
SELECT 
    'Verification Summary' as check_type,
    COUNT(DISTINCT up."learner_id") as test_learners_found,
    COUNT(DISTINCT cc."learner_id") as learners_with_completions,
    COUNT(cc."course_id") as total_completions,
    CASE 
        WHEN COUNT(DISTINCT up."learner_id") = COUNT(DISTINCT cc."learner_id") 
        THEN '✅ All test learners have completions'
        ELSE '⚠️ Some test learners missing completions'
    END as status
FROM "userProfiles" up
LEFT JOIN "course_completions" cc ON up."learner_id" = cc."learner_id" AND cc."course_id" = 1
WHERE up."learner_name" LIKE 'Test Learner%';
```

**Expected Result:**
- `test_learners_found` = 1 (or number of test learners created)
- `learners_with_completions` = 1 (should match test_learners_found)
- `total_completions` = 1 (should match number of test learners)
- `status` = `'✅ All test learners have completions'`

---

## Step 6: Cleanup (Optional - For Testing Only)

**Remove Test Data:**
```sql
-- Delete test course completion
DELETE FROM "course_completions"
WHERE "learner_id" IN (
    SELECT "learner_id" 
    FROM "userProfiles" 
    WHERE "learner_name" LIKE 'Test Learner%'
);

-- Delete test learner
DELETE FROM "userProfiles"
WHERE "learner_name" LIKE 'Test Learner%';
```

**⚠️ Warning:** Only run cleanup if you want to remove test data. Do not run on production data.

---

## Summary of Safety Measures

1. **UUID Generation:** Uses PostgreSQL `gen_random_uuid()` or Node.js `randomUUID()`
2. **Connection Validation:** Tests connection before attempting inserts
3. **Permission Checks:** Verifies INSERT/SELECT permissions before operations
4. **RLS Awareness:** Understands RLS policies and uses service role when needed
5. **Duplicate Prevention:** Uses `ON CONFLICT DO NOTHING` and `WHERE NOT EXISTS`
6. **Type Safety:** Explicit type casting (`::uuid`, `::bigint`, `::text`)
7. **Foreign Key Validation:** Ensures `learner_id` exists before inserting completion
8. **Verification Queries:** Multiple checks to confirm successful insertion
9. **Error Handling:** Try-catch blocks and conflict handling prevent crashes
10. **Transaction Safety:** All operations in single transaction (SQL Editor) or with error handling (Node.js)

---

## Next Steps After Successful Test

Once the test insertion works successfully:

1. **Verify the Node.js script can connect** using the same SUPABASE_URL
2. **Test the script's duplicate prevention logic**
3. **Verify the script handles errors gracefully**
4. **Confirm the script can insert for multiple users**
5. **Test with the actual first two learners** (if needed)

This test process ensures the Supabase connection and insertion mechanism works correctly before running on production data.

