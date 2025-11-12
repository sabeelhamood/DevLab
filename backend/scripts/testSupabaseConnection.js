import 'dotenv/config'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'

/**
 * Test Supabase Connection from Railway Backend
 * 
 * This script verifies that:
 * 1. Railway backend can connect to Supabase using SUPABASE_URL
 * 2. Service role has proper permissions
 * 3. Can insert into userProfiles and course_completions tables
 * 
 * Run on Railway: node scripts/testSupabaseConnection.js
 */

// Get SUPABASE_URL from environment (set in Railway)
const connectionString = process.env.SUPABASE_URL

if (!connectionString) {
  console.error('❌ SUPABASE_URL environment variable is not set')
  console.error('Please ensure SUPABASE_URL is configured in Railway environment variables')
  process.exit(1)
}

// Remove sslmode from connection string if present, we'll handle SSL in Pool config
const cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/gi, '')

// Create PostgreSQL connection pool with SSL for Supabase
const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: {
    rejectUnauthorized: false  // Required for Supabase SSL certificates
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

// Handle pool errors
pool.on('error', (error) => {
  console.error('❌ Unexpected PostgreSQL pool error:', error)
})

/**
 * Test connection to Supabase
 */
const testConnection = async () => {
  try {
    console.log('🔍 Step 1: Testing connection to Supabase...')
    const result = await pool.query('SELECT version(), current_database(), current_user, now()')
    const row = result.rows[0]
    
    console.log('✅ Connected to Supabase successfully!')
    console.log('   PostgreSQL Version:', row.version.split(' ')[0] + ' ' + row.version.split(' ')[1])
    console.log('   Database:', row.current_database)
    console.log('   User:', row.current_user)
    console.log('   Timestamp:', row.now)
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    console.error('   Error details:', error)
    return false
  }
}

/**
 * Insert test learner into userProfiles
 */
const insertTestLearner = async () => {
  try {
    console.log('\n🔍 Step 2: Inserting test learner into userProfiles...')
    
    // Generate random UUID using Node.js crypto
    const testLearnerId = randomUUID()
    const timestamp = new Date().toISOString()
    const testLearnerName = `Railway Test Learner ${timestamp}`
    
    console.log('   Generated UUID:', testLearnerId)
    console.log('   Learner Name:', testLearnerName)
    
    // Insert test learner with ON CONFLICT to prevent duplicate UUIDs
    const insertQuery = `
      INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
      VALUES ($1::uuid, $2::text, now(), now())
      ON CONFLICT ("learner_id") DO NOTHING
      RETURNING "learner_id", "learner_name", "created_at"
    `
    
    const result = await pool.query(insertQuery, [testLearnerId, testLearnerName])
    
    if (result.rows.length > 0) {
      console.log('✅ Test learner inserted successfully!')
      console.log('   Learner ID:', result.rows[0].learner_id)
      console.log('   Learner Name:', result.rows[0].learner_name)
      console.log('   Created At:', result.rows[0].created_at)
      return {
        success: true,
        learnerId: result.rows[0].learner_id,
        learnerName: result.rows[0].learner_name
      }
    } else {
      console.log('⚠️ Test learner UUID already exists (unlikely but handled)')
      return {
        success: false,
        learnerId: testLearnerId,
        learnerName: testLearnerName
      }
    }
  } catch (error) {
    console.error('❌ Failed to insert test learner:', error.message)
    console.error('   Error details:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Insert course completion for test learner
 */
const insertCourseCompletion = async (learnerId) => {
  try {
    console.log('\n🔍 Step 3: Inserting course completion into course_completions...')
    console.log('   Learner ID:', learnerId)
    console.log('   Course ID: 1')
    console.log('   Course Name: Introduction to Programming')
    
    // Insert course completion with WHERE NOT EXISTS to prevent duplicates
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
    
    const result = await pool.query(insertQuery, [learnerId])
    
    if (result.rows.length > 0) {
      console.log('✅ Course completion inserted successfully!')
      console.log('   Learner ID:', result.rows[0].learner_id)
      console.log('   Course ID:', result.rows[0].course_id)
      console.log('   Course Name:', result.rows[0].course_name)
      console.log('   Completed At:', result.rows[0].completed_at)
      return {
        success: true,
        completion: result.rows[0]
      }
    } else {
      console.log('⚠️ Course completion already exists for this learner and course')
      return {
        success: false,
        message: 'Already exists'
      }
    }
  } catch (error) {
    console.error('❌ Failed to insert course completion:', error.message)
    console.error('   Error details:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Verify the inserted data
 */
const verifyInsertions = async (learnerId) => {
  try {
    console.log('\n🔍 Step 4: Verifying inserted data...')
    
    // Verify learner exists
    const learnerCheck = await pool.query(
      'SELECT "learner_id", "learner_name", "created_at" FROM "userProfiles" WHERE "learner_id" = $1::uuid',
      [learnerId]
    )
    
    if (learnerCheck.rows.length === 0) {
      console.log('❌ Verification failed: Test learner not found')
      return false
    }
    
    console.log('✅ Learner verified:', learnerCheck.rows[0].learner_name)
    
    // Verify course completion exists
    const completionCheck = await pool.query(
      `SELECT 
        cc."learner_id",
        up."learner_name",
        cc."course_id",
        cc."course_name",
        cc."completed_at"
      FROM "course_completions" cc
      INNER JOIN "userProfiles" up ON cc."learner_id" = up."learner_id"
      WHERE cc."learner_id" = $1::uuid
        AND cc."course_id" = 1::bigint`,
      [learnerId]
    )
    
    if (completionCheck.rows.length === 0) {
      console.log('❌ Verification failed: Course completion not found')
      return false
    }
    
    console.log('✅ Course completion verified')
    console.log('   Course:', completionCheck.rows[0].course_name)
    console.log('   Completed At:', completionCheck.rows[0].completed_at)
    
    return true
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
    return false
  }
}

/**
 * Clean up test data
 */
const cleanupTestData = async (learnerId) => {
  try {
    console.log('\n🔍 Step 5: Cleaning up test data...')
    console.log('   Learner ID to delete:', learnerId)
    
    // Delete course completion first (due to foreign key)
    const deleteCompletion = await pool.query(
      'DELETE FROM "course_completions" WHERE "learner_id" = $1::uuid',
      [learnerId]
    )
    console.log(`   Deleted ${deleteCompletion.rowCount} course completion(s)`)
    
    // Delete test learner
    const deleteLearner = await pool.query(
      'DELETE FROM "userProfiles" WHERE "learner_id" = $1::uuid',
      [learnerId]
    )
    console.log(`   Deleted ${deleteLearner.rowCount} learner(s)`)
    
    console.log('✅ Test data cleaned up successfully')
    return true
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
    console.error('   You may need to manually delete the test data')
    console.error('   Learner ID:', learnerId)
    return false
  }
}

/**
 * Main test function
 */
const runTest = async () => {
  let learnerId = null
  
  try {
    console.log('='.repeat(70))
    console.log('SUPABASE CONNECTION TEST FROM RAILWAY BACKEND')
    console.log('='.repeat(70))
    console.log('Environment: Railway Backend')
    console.log('Connection: Using SUPABASE_URL from Railway environment variables')
    console.log('='.repeat(70))
    
    // Step 1: Test connection
    const connectionOk = await testConnection()
    if (!connectionOk) {
      console.error('\n❌ Connection test failed. Cannot proceed.')
      process.exit(1)
    }
    
    // Step 2: Insert test learner
    const learnerResult = await insertTestLearner()
    if (!learnerResult.success) {
      console.error('\n❌ Failed to insert test learner. Cannot proceed.')
      if (learnerResult.error) {
        console.error('   This may indicate a permissions issue or RLS policy blocking the insert.')
      }
      process.exit(1)
    }
    
    learnerId = learnerResult.learnerId
    
    // Step 3: Insert course completion
    const completionResult = await insertCourseCompletion(learnerId)
    if (!completionResult.success) {
      console.error('\n⚠️ Failed to insert course completion.')
      if (completionResult.error) {
        console.error('   This may indicate a permissions issue or RLS policy blocking the insert.')
      }
    }
    
    // Step 4: Verify insertions
    const verified = await verifyInsertions(learnerId)
    if (!verified) {
      console.error('\n⚠️ Verification failed - data may not have been inserted correctly.')
    }
    
    // Step 5: Cleanup (optional - comment out if you want to keep test data)
    const CLEANUP_ENABLED = process.env.CLEANUP_TEST_DATA !== 'false'  // Default: true
    if (CLEANUP_ENABLED) {
      await cleanupTestData(learnerId)
    } else {
      console.log('\n⚠️ Cleanup disabled. Test data remains in database.')
      console.log('   Learner ID:', learnerId)
      console.log('   To clean up manually, use the UUID above to delete from Supabase.')
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70))
    console.log('TEST SUMMARY')
    console.log('='.repeat(70))
    console.log('Connection Test: ✅ PASSED')
    console.log('Learner Insertion: ', learnerResult.success ? '✅ PASSED' : '❌ FAILED')
    console.log('Course Completion Insertion: ', completionResult.success ? '✅ PASSED' : '❌ FAILED')
    console.log('Verification: ', verified ? '✅ PASSED' : '❌ FAILED')
    console.log('='.repeat(70))
    
    if (connectionOk && learnerResult.success && completionResult.success && verified) {
      console.log('✅ ALL TESTS PASSED - Supabase connection from Railway is working correctly!')
      return true
    } else {
      console.log('⚠️ SOME TESTS FAILED - Review the output above for details.')
      return false
    }
    
  } catch (error) {
    console.error('\n❌ Test script failed with unexpected error:', error)
    console.error('   Error stack:', error.stack)
    
    // Attempt cleanup on error if we have a learner ID
    if (learnerId) {
      console.log('\n⚠️ Attempting cleanup after error...')
      await cleanupTestData(learnerId)
    }
    
    throw error
  } finally {
    // Always close the connection pool
    await pool.end()
    console.log('\n✅ Database connection closed.')
  }
}

// Run the test
runTest()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Test script crashed:', error)
    process.exit(1)
  })

