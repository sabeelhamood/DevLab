# Supabase Query Flow - Backend Code Reference

## 🔌 Database Connection

**File:** `backend/src/config/database.js`

### Connection Setup
```javascript
// Line 4-20: Connection string from environment variable
let connectionString = process.env.SUPABASE_URL

// Removes sslmode parameter and handles SSL
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

// Exported postgres object used for all queries
export const postgres = {
  pool,
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  quoteIdentifier
}
```

### Table Names
```javascript
// Line 78-89: Table name mapping
export const getSupabaseTables = () => {
  return {
    competitions: 'competitions',  // ← This is the table name used
    userProfiles: 'userProfiles',
    courseCompletions: 'course_completions',
    // ... other tables
  }
}
```

---

## 📊 Competition Model (Main Query File)

**File:** `backend/src/models/Competition.js`

### Table Reference
```javascript
// Line 9-11: Gets table name and quotes it
const tables = getSupabaseTables()
const competitionTableName = tables.competitions  // = 'competitions'
const competitionsTable = postgres.quoteIdentifier(competitionTableName)  // = "competitions"
```

### Key Query Methods

#### 1. findById() - Get Single Competition
**Line 206-231:**
```javascript
static async findById(competitionId) {
  const { rows } = await postgres.query(
    `SELECT * FROM ${competitionsTable} WHERE "competition_id" = $1 LIMIT 1`,
    [competitionId]
  )
  // Returns: competition object or null
}
```
**SQL Query:** `SELECT * FROM "competitions" WHERE "competition_id" = $1 LIMIT 1`

#### 2. findByLearner() - Get Competitions by Learner
**Line 256-269:**
```javascript
static async findByLearner(learnerId) {
  const { rows } = await postgres.query(
    `SELECT * FROM ${competitionsTable}
     WHERE "learner1_id" = $1 OR "learner2_id" = $1
     ORDER BY "created_at" DESC`,
    [learnerId]
  )
}
```
**SQL Query:** `SELECT * FROM "competitions" WHERE "learner1_id" = $1 OR "learner2_id" = $1`

#### 3. getActive() - Get Active Competitions
**Line 270-283:**
```javascript
static async getActive() {
  const { rows } = await postgres.query(
    `SELECT * FROM ${competitionsTable}
     WHERE "status" = 'active' OR ("status" IS NULL AND "result" IS NULL)
     ORDER BY "created_at" DESC`
  )
}
```

#### 4. findByCourse() - Get Competitions by Course
**Line 241-254:**
```javascript
static async findByCourse(courseId) {
  const { rows } = await postgres.query(
    `SELECT * FROM ${competitionsTable}
     WHERE "course_id" = $1
     ORDER BY "created_at" DESC`,
    [courseId]
  )
}
```

---

## 🎮 Controller (Uses Model)

**File:** `backend/src/controllers/competitionController.js`

### getCompetition() Method
**Line 328-351:**
```javascript
async getCompetition(req, res) {
  const { id } = req.params
  const competition = await CompetitionModel.findById(id)  // ← Calls model
  
  if (!competition) {
    return res.status(404).json({
      success: false,
      error: 'Competition not found'
    })
  }
  
  res.json({
    success: true,
    data: competition
  })
}
```

---

## 🛣️ Routes (Calls Controller)

**File:** `backend/src/routes/competitions/competitionRoutes.js`

### Route Definition
**Line 102-111:**
```javascript
router.get('/:id', (req, res, next) => {
  console.log('🔍 [competitions] Route matched for /:id')
  competitionController.getCompetition(req, res, next)
})
```

### Route Registration
**File:** `backend/src/app.js` **Line 274-291:**
```javascript
app.use('/api/competitions', competitionRoutes)
```

**Full Path:** `/api/competitions/:id`

---

## 🔍 Complete Request Flow

1. **Request:** `GET /api/competitions/1c8fe3d5-6b80-417f-a1aa-d3694d84d6ec`

2. **Route Matching:** `backend/src/routes/competitions/competitionRoutes.js`
   - Matches `/:id` pattern
   - Extracts `id = "1c8fe3d5-6b80-417f-a1aa-d3694d84d6ec"`

3. **Controller:** `backend/src/controllers/competitionController.js`
   - Calls `CompetitionModel.findById(id)`

4. **Model:** `backend/src/models/Competition.js`
   - Executes: `SELECT * FROM "competitions" WHERE "competition_id" = $1`
   - Uses: `postgres.query()` from `database.js`

5. **Database:** `backend/src/config/database.js`
   - Uses `SUPABASE_URL` from Railway environment
   - Executes query via PostgreSQL pool

---

## 🧪 Test Endpoint

**File:** `backend/src/app.js` **Line 231-272:**

**URL:** `GET /api/test-supabase`

**What it does:**
1. Tests connection: `SELECT 1 as test`
2. Queries all competitions: `SELECT competition_id, course_name, course_id, status FROM competitions LIMIT 10`
3. Searches for specific ID: `SELECT * FROM competitions WHERE competition_id = $1`

---

## 📋 Key Points to Check

1. **Table Name:** The code queries `"competitions"` (with quotes, lowercase)
2. **Column Name:** Uses `"competition_id"` (UUID type)
3. **Connection:** Uses `SUPABASE_URL` from Railway environment variables
4. **Schema:** Assumes `public` schema (default in PostgreSQL)

---

## 🔧 Debugging Checklist

- [ ] Verify `SUPABASE_URL` in Railway matches your Supabase project
- [ ] Check table name in Supabase is exactly `competitions` (lowercase)
- [ ] Verify column `competition_id` exists and is UUID type
- [ ] Check if competition exists in `public.competitions` schema
- [ ] Test with `/api/test-supabase` endpoint to see what data backend can access

