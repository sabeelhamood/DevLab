# Test Supabase Connection from Railway

This script verifies that the Railway backend can successfully connect to Supabase and perform database operations.

## Script: `testSupabaseConnection.js`

### What it does:

1. **Tests Connection**: Verifies connection to Supabase using `SELECT version()`
2. **Inserts Test Learner**: Creates a test learner in `userProfiles` table with:
   - Random UUID (using `crypto.randomUUID()`)
   - Name: "Railway Test Learner" with timestamp
3. **Inserts Course Completion**: Adds a course completion for the test learner in `course_completions` table
4. **Verifies Data**: Confirms both insertions were successful
5. **Cleans Up**: Removes test data (can be disabled)

### How to Run on Railway:

#### Option 1: Via Railway Console (Recommended)

1. Go to Railway Dashboard → Your Project → Your Service
2. Click on **"Deployments"** tab
3. Click on the latest deployment
4. Click **"View Logs"** or open **"Console"**
5. Run:
   ```bash
   node scripts/testSupabaseConnection.js
   ```

#### Option 2: Via Railway CLI

```bash
railway login
railway link
railway run node scripts/testSupabaseConnection.js
```

#### Option 3: Add as Railway Command

In Railway Dashboard → Your Service → Settings → Deploy:
- Add a custom command: `node scripts/testSupabaseConnection.js`
- Or add it to your `package.json` scripts section

### Environment Variables Required:

- `SUPABASE_URL` - Must be set in Railway environment variables
  - Format: `postgresql://[user]:[password]@[host]:[port]/[database]`
  - Should contain service role credentials to bypass RLS

### Optional Environment Variables:

- `CLEANUP_TEST_DATA=false` - Set to `false` to keep test data in database (default: cleanup enabled)

### Expected Output:

```
======================================================================
SUPABASE CONNECTION TEST FROM RAILWAY BACKEND
======================================================================
Environment: Railway Backend
Connection: Using SUPABASE_URL from Railway environment variables
======================================================================
🔍 Step 1: Testing connection to Supabase...
✅ Connected to Supabase successfully!
   PostgreSQL Version: PostgreSQL 15.x
   Database: postgres
   User: postgres.xxxxx
   Timestamp: 2024-01-01 12:00:00

🔍 Step 2: Inserting test learner into userProfiles...
   Generated UUID: 550e8400-e29b-41d4-a716-446655440000
   Learner Name: Railway Test Learner 2024-01-01T12:00:00.000Z
✅ Test learner inserted successfully!
   Learner ID: 550e8400-e29b-41d4-a716-446655440000
   Learner Name: Railway Test Learner 2024-01-01T12:00:00.000Z
   Created At: 2024-01-01 12:00:00

🔍 Step 3: Inserting course completion into course_completions...
   Learner ID: 550e8400-e29b-41d4-a716-446655440000
   Course ID: 1
   Course Name: Introduction to Programming
✅ Course completion inserted successfully!
   Learner ID: 550e8400-e29b-41d4-a716-446655440000
   Course ID: 1
   Course Name: Introduction to Programming
   Completed At: 2024-01-01 12:00:00

🔍 Step 4: Verifying inserted data...
✅ Learner verified: Railway Test Learner 2024-01-01T12:00:00.000Z
✅ Course completion verified
   Course: Introduction to Programming
   Completed At: 2024-01-01 12:00:00

🔍 Step 5: Cleaning up test data...
   Learner ID to delete: 550e8400-e29b-41d4-a716-446655440000
   Deleted 1 course completion(s)
   Deleted 1 learner(s)
✅ Test data cleaned up successfully

======================================================================
TEST SUMMARY
======================================================================
Connection Test: ✅ PASSED
Learner Insertion: ✅ PASSED
Course Completion Insertion: ✅ PASSED
Verification: ✅ PASSED
======================================================================
✅ ALL TESTS PASSED - Supabase connection from Railway is working correctly!
```

### Troubleshooting:

#### Connection Failed
- Verify `SUPABASE_URL` is set in Railway environment variables
- Check that the connection string format is correct
- Ensure Railway service has network access to Supabase

#### Insertion Failed
- Verify service role credentials are in `SUPABASE_URL`
- Check RLS policies - service role should bypass RLS
- Verify INSERT permissions on `userProfiles` and `course_completions` tables

#### Permission Errors
- Ensure `SUPABASE_URL` uses service role (not anon key)
- Service role format: `postgresql://postgres.[ref]:[password]@[host]:[port]/postgres`
- Check table permissions in Supabase dashboard

### Notes:

- The script automatically cleans up test data after verification
- To keep test data for inspection, set `CLEANUP_TEST_DATA=false`
- The script uses the same connection pattern as the main application
- SSL is properly configured for Supabase connections

