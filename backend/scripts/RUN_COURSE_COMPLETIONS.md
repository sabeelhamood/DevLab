# How to Run addCourseCompletionsForAllUsers.js

## Step 1: Get SUPABASE_URL from Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Select your project
3. Go to **Settings** → **Variables**
4. Find `SUPABASE_URL` and copy the value (it should look like: `postgresql://user:password@host:port/database`)

## Step 2: Run the Script

### Option A: With SUPABASE_URL as argument
```bash
cd backend
node scripts/addCourseCompletionsForAllUsers.js "postgresql://user:password@host:port/database"
```

### Option B: With SUPABASE_URL in environment
```bash
cd backend
$env:SUPABASE_URL="postgresql://user:password@host:port/database"; node scripts/addCourseCompletionsForAllUsers.js
```

### Option C: Using Railway CLI (if authenticated)
```bash
cd backend
railway login
railway run node scripts/addCourseCompletionsForAllUsers.js
```

## Step 3: Verify Results

After running the script, open Supabase and check the `course_completions` table to see the new rows.

