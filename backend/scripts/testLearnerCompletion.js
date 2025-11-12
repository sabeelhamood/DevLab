import 'dotenv/config'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

// ============================================================================
// IMPROVED NODE.JS TEST SCRIPT: Add New Test Learner and Course Completion
// ============================================================================
// This script tests Supabase connection and insertion with all safety checks:
// 1. Tests connection first with SELECT version()
// 2. Uses service role credentials (from SUPABASE_URL)
// 3. Proper SSL configuration
// 4. Creates test learner with crypto.randomUUID()
// 5. Adds course completion with duplicate prevention
// 6. Comprehensive verification
// ============================================================================

// Get SUPABASE_URL from command line argument or environment variable
let connectionString = process.argv[2] || process.env.SUPABASE_URL

if (!connectionString) {
  console.error('❌ SUPABASE_URL is not configured.')
  console.error('Usage: node testLearnerCompletion.js [SUPABASE_URL]')
  console.error('Or set SUPABASE_URL as environment variable')
  process.exit(1)
}

// Remove sslmode from connection string if present, we'll handle SSL in Pool config
connectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

// Create PostgreSQL connection pool with SSL for Supabase
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase SSL certificates
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL error:', error)
})

const postgres = {
  pool,
  query: (text, params) => pool.query(text, params)
}

/**
 * Test connection to Supabase
 */
const testConnection = async () => {
  try {
    console.log('🔍 Step 0: Testing connection to Supabase...')
    const { rows } = await postgres.query('SELECT version(), current_database(), current_user, now()')
    console.log('✅ Connection successful!')
    console.log('   PostgreSQL Version:', rows[0].version.split(' ')[0] + ' ' + rows[0].version.split(' ')[1])
    console.log('   Database:', rows[0].current_database)
    console.log('   User:', rows[0].current_user)
    console.log('   Timestamp:', rows[0].now)
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

/**
 * Check permissions on tables
 */
const checkPermissions = async () => {
  try {
    console.log('\n🔍 Step 0.1: Checking permissions...')
    
    const userProfilesPerms = await postgres.query(
      `SELECT 
        has_table_privilege(current_user, 'userProfiles', 'SELECT') as can_select,
        has_table_privilege(current_user, 'userProfiles', 'INSERT') as can_insert
      `
    )
    
    const courseCompletionsPerms = await postgres.query(
      `SELECT 
        has_table_privilege(current_user, 'course_completions', 'SELECT') as can_select,
        has_table_privilege(current_user, 'course_completions', 'INSERT') as can_insert
      `
    )
    
    const upPerms = userProfilesPerms.rows[0]
    const ccPerms = courseCompletionsPerms.rows[0]
    
    console.log('   userProfiles - SELECT:', upPerms.can_select ? '✅' : '❌')
    console.log('   userProfiles - INSERT:', upPerms.can_insert ? '✅' : '❌')
    console.log('   course_completions - SELECT:', ccPerms.can_select ? '✅' : '❌')
    console.log('   course_completions - INSERT:', ccPerms.can_insert ? '✅' : '❌')
    
    if (!upPerms.can_select || !upPerms.can_insert || !ccPerms.can_select || !ccPerms.can_insert) {
      console.error('❌ Missing required permissions!')
      return false
    }
    
    return true
  } catch (error) {
    console.error('❌ Permission check failed:', error.message)
    return false
  }
}

/**
 * Check RLS status
 */
const checkRLS = async () => {
  try {
    console.log('\n🔍 Step 0.2: Checking RLS status...')
    
    const { rows } = await postgres.query(
      `SELECT 
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('userProfiles', 'course_completions')
      ORDER BY tablename`
    )
    
    rows.forEach(row => {
      const status = row.rls_enabled ? '⚠️ ENABLED' : '✅ DISABLED'
      console.log(`   ${row.tablename}: RLS ${status}`)
      if (row.rls_enabled) {
        console.log('      Note: Service role should bypass RLS')
      }
    })
    
    return true
  } catch (error) {
    console.error('❌ RLS check failed:', error.message)
    return false
  }
}

/**
 * Insert test learner
 */
const insertTestLearner = async () => {
  try {
    console.log('\n🔍 Step 1: Inserting test learner...')
    
    // Generate UUID using Node.js crypto.randomUUID()
    const testLearnerId = randomUUID()
    const testLearnerName = `Test Learner ${new Date().toISOString()}`
    
    console.log('   Generated UUID:', testLearnerId)
    console.log('   Learner Name:', testLearnerName)
    
    // Insert with ON CONFLICT to prevent duplicate UUIDs
    const insertQuery = `
      INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
      VALUES ($1::uuid, $2::text, now(), now())
      ON CONFLICT ("learner_id") DO NOTHING
      RETURNING "learner_id", "learner_name", "created_at"
    `
    
    const { rows } = await postgres.query(insertQuery, [testLearnerId, testLearnerName])
    
    if (rows.length > 0) {
      console.log('✅ Test learner inserted successfully')
      console.log('   Learner ID:', rows[0].learner_id)
      console.log('   Learner Name:', rows[0].learner_name)
      console.log('   Created At:', rows[0].created_at)
      return { learnerId: rows[0].learner_id, learnerName: rows[0].learner_name }
    } else {
      console.log('⚠️ Test learner UUID already exists, skipping insertion')
      return null
    }
  } catch (error) {
    console.error('❌ Failed to insert test learner:', error.message)
    throw error
  }
}

/**
 * Insert course completion for test learner
 */
const insertCourseCompletion = async (learnerId) => {
  try {
    console.log('\n🔍 Step 2: Inserting course completion...')
    console.log('   Learner ID:', learnerId)
    console.log('   Course ID: 1')
    console.log('   Course Name: Introduction to Programming')
    
    // Insert with WHERE NOT EXISTS to prevent duplicates
    const insertQuery = `
      INSERT INTO "course_completions" ("learner_id", "course_id", "course_name", "completed_at")
      SELECT 
        $1::uuid,
        1::bigint,
        'Introduction to Programming'::text,
        now()
      WHERE NOT EXISTS (
        SELECT 1 
        FROM "course_completions" 
        WHERE "learner_id" = $1::uuid
          AND "course_id" = 1::bigint
      )
      RETURNING "learner_id", "course_id", "course_name", "completed_at"
    `
    
    const { rows } = await postgres.query(insertQuery, [learnerId])
    
    if (rows.length > 0) {
      console.log('✅ Course completion inserted successfully')
      console.log('   Learner ID:', rows[0].learner_id)
      console.log('   Course ID:', rows[0].course_id)
      console.log('   Course Name:', rows[0].course_name)
      console.log('   Completed At:', rows[0].completed_at)
      return rows[0]
    } else {
      console.log('⚠️ Course completion already exists for this learner and course')
      return null
    }
  } catch (error) {
    console.error('❌ Failed to insert course completion:', error.message)
    throw error
  }
}

/**
 * Verify test learner was inserted
 */
const verifyLearner = async (learnerId) => {
  try {
    console.log('\n🔍 Step 3.1: Verifying test learner...')
    
    const { rows } = await postgres.query(
      'SELECT "learner_id", "learner_name", "created_at" FROM "userProfiles" WHERE "learner_id" = $1::uuid',
      [learnerId]
    )
    
    if (rows.length > 0) {
      console.log('✅ Test learner verified')
      console.log('   Learner ID:', rows[0].learner_id)
      console.log('   Learner Name:', rows[0].learner_name)
      console.log('   Created At:', rows[0].created_at)
      return true
    } else {
      console.log('❌ Test learner not found')
      return false
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

/**
 * Verify course completion was inserted
 */
const verifyCompletion = async (learnerId) => {
  try {
    console.log('\n🔍 Step 3.2: Verifying course completion...')
    
    const { rows } = await postgres.query(
      `SELECT 
        cc."learner_id",
        up."learner_name",
        cc."course_id",
        cc."course_name",
        cc."completed_at"
      FROM "course_completions" cc
      INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
      WHERE cc."learner_id" = $1::uuid
        AND cc."course_id" = 1::bigint
      ORDER BY cc."completed_at" DESC
      LIMIT 1`,
      [learnerId]
    )
    
    if (rows.length > 0) {
      console.log('✅ Course completion verified')
      console.log('   Learner ID:', rows[0].learner_id)
      console.log('   Learner Name:', rows[0].learner_name)
      console.log('   Course ID:', rows[0].course_id)
      console.log('   Course Name:', rows[0].course_name)
      console.log('   Completed At:', rows[0].completed_at)
      return true
    } else {
      console.log('❌ Course completion not found')
      return false
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

/**
 * Check for duplicates
 */
const checkDuplicates = async (learnerId) => {
  try {
    console.log('\n🔍 Step 3.3: Checking for duplicates...')
    
    const { rows } = await postgres.query(
      `SELECT 
        "learner_id",
        "course_id",
        COUNT(*) as completion_count
      FROM "course_completions"
      WHERE "learner_id" = $1::uuid
      GROUP BY "learner_id", "course_id"
      HAVING COUNT(*) >= 1`,
      [learnerId]
    )
    
    if (rows.length === 0) {
      console.log('❌ No completions found')
      return false
    }
    
    const row = rows[0]
    if (row.completion_count > 1) {
      console.log('⚠️ DUPLICATE FOUND - Multiple completions for same learner+course')
      console.log('   Count:', row.completion_count)
      return false
    } else {
      console.log('✅ No duplicates - Single completion per learner+course')
      console.log('   Count:', row.completion_count)
      return true
    }
  } catch (error) {
    console.error('❌ Duplicate check failed:', error.message)
    return false
  }
}

/**
 * Verify foreign key integrity
 */
const verifyForeignKey = async (learnerId) => {
  try {
    console.log('\n🔍 Step 3.4: Verifying foreign key integrity...')
    
    const { rows } = await postgres.query(
      `SELECT 
        cc."learner_id",
        CASE 
          WHEN up."learner_id" IS NULL THEN false
          ELSE true
        END as foreign_key_valid
      FROM "course_completions" cc
      LEFT JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
      WHERE cc."learner_id" = $1::uuid
      LIMIT 1`,
      [learnerId]
    )
    
    if (rows.length > 0) {
      if (rows[0].foreign_key_valid) {
        console.log('✅ Foreign key integrity verified')
        return true
      } else {
        console.log('❌ ORPHANED - Foreign key violation!')
        return false
      }
    } else {
      console.log('❌ No completion found to verify')
      return false
    }
  } catch (error) {
    console.error('❌ Foreign key verification failed:', error.message)
    return false
  }
}

/**
 * Main test function
 */
const runTest = async () => {
  try {
    console.log('='.repeat(60))
    console.log('TEST: Add New Learner and Course Completion')
    console.log('='.repeat(60))
    
    // Step 0: Pre-flight checks
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.error('\n❌ Connection test failed. Exiting.')
      process.exit(1)
    }
    
    const permissionsOk = await checkPermissions()
    if (!permissionsOk) {
      console.error('\n❌ Permission check failed. Exiting.')
      process.exit(1)
    }
    
    await checkRLS()
    
    // Step 1: Insert test learner
    const learner = await insertTestLearner()
    if (!learner) {
      console.log('\n⚠️ Test learner was not inserted (may already exist)')
      console.log('   Exiting test.')
      process.exit(0)
    }
    
    // Step 2: Insert course completion
    const completion = await insertCourseCompletion(learner.learnerId)
    if (!completion) {
      console.log('\n⚠️ Course completion was not inserted (may already exist)')
    }
    
    // Step 3: Verification
    console.log('\n' + '='.repeat(60))
    console.log('VERIFICATION')
    console.log('='.repeat(60))
    
    const learnerVerified = await verifyLearner(learner.learnerId)
    const completionVerified = completion ? await verifyCompletion(learner.learnerId) : false
    const noDuplicates = completion ? await checkDuplicates(learner.learnerId) : false
    const fkValid = completion ? await verifyForeignKey(learner.learnerId) : false
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('TEST SUMMARY')
    console.log('='.repeat(60))
    console.log('Connection Test: ✅')
    console.log('Permissions Check: ✅')
    console.log('Test Learner Inserted:', learnerVerified ? '✅' : '❌')
    console.log('Course Completion Inserted:', completionVerified ? '✅' : '❌')
    console.log('No Duplicates:', noDuplicates ? '✅' : '❌')
    console.log('Foreign Key Valid:', fkValid ? '✅' : '❌')
    
    const allPassed = learnerVerified && completionVerified && noDuplicates && fkValid
    
    if (allPassed) {
      console.log('\n✅ ALL TESTS PASSED!')
      console.log('   Test learner and course completion were successfully added.')
    } else {
      console.log('\n⚠️ SOME TESTS FAILED')
      console.log('   Review the output above for details.')
    }
    
    return allPassed
  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    throw error
  } finally {
    // Close the database connection
    await pool.end()
  }
}

// Run the test
runTest()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error)
    process.exit(1)
  })

