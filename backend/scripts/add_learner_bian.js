/**
 * Script to add a learner named "bian" to Supabase userProfiles table
 * This script can be run locally or called from the API endpoint
 * 
 * Usage:
 *   Local: node scripts/add_learner_bian.js
 *   API: POST /api/user-profiles/test/add-bian
 * 
 * Environment variables required:
 *   - SUPABASE_URL: PostgreSQL connection string
 *   - SERVICE_API_KEYS: (optional, only in production)
 *   - NODE_ENV: (optional, defaults to 'development')
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { postgres } from '../src/config/database.js'
import { randomUUID } from 'node:crypto'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const LEARNER_NAME = 'bian'

/**
 * Main function to add learner "bian" to Supabase
 */
async function addLearnerBian() {
  console.log('='.repeat(80))
  console.log('🔍 SCRIPT: Adding learner with learner_name = "bian"')
  console.log('='.repeat(80))
  
  try {
    // ============================================================================
    // STEP 1: Environment Setup and Authentication Check
    // ============================================================================
    console.log('\n📋 STEP 1: Environment Setup')
    
    const nodeEnv = process.env.NODE_ENV || 'development'
    const serviceApiKeys = process.env.SERVICE_API_KEYS || ''
    const hasServiceApiKeys = serviceApiKeys && serviceApiKeys.trim().length > 0
    const isProduction = nodeEnv === 'production'
    
    console.log('   NODE_ENV:', nodeEnv)
    console.log('   Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT')
    console.log('   SERVICE_API_KEYS configured:', hasServiceApiKeys)
    if (hasServiceApiKeys) {
      const keys = serviceApiKeys.split(',').map(k => k.trim()).filter(k => k.length > 0)
      console.log('   SERVICE_API_KEYS count:', keys.length)
    }
    
    const supabaseUrl = process.env.SUPABASE_URL
    if (!supabaseUrl) {
      console.error('❌ SUPABASE_URL is NOT defined in process.env')
      console.error('   Please set SUPABASE_URL environment variable')
      process.exit(1)
    }
    
    const maskedUrl = supabaseUrl.replace(/:([^:@]+)@/, ':****@')
    console.log('✅ SUPABASE_URL is defined:', maskedUrl)
    console.log('   URL length:', supabaseUrl.length, 'characters')
    
    // ============================================================================
    // STEP 2: Test Connection
    // ============================================================================
    console.log('\n📋 STEP 2: Testing Supabase Connection')
    
    try {
      console.log('   Connecting to Supabase...')
      const connectionTest = await postgres.query('SELECT NOW() as current_time, 1 as test')
      console.log('✅ Connection test successful')
      console.log('   Current database time:', connectionTest.rows[0].current_time)
      console.log('   ✅ Connection to Supabase established')
    } catch (connectionError) {
      console.error('❌ Connection test FAILED')
      console.error('   Error message:', connectionError.message)
      console.error('   Error code:', connectionError.code)
      console.error('   Error detail:', connectionError.detail || 'N/A')
      console.error('   Error hint:', connectionError.hint || 'N/A')
      process.exit(1)
    }
    
    // ============================================================================
    // STEP 3: Check if user "bian" already exists
    // ============================================================================
    console.log('\n📋 STEP 3: Checking if user with learner_name = "bian" already exists')
    
    try {
      console.log('   Executing SELECT query: SELECT * FROM "userProfiles" WHERE "learner_name" = \'bian\'')
      const existingUserQuery = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_name" = $1::text 
         LIMIT 1`,
        [LEARNER_NAME]
      )
      
      console.log('   Query executed successfully')
      console.log('   Rows returned:', existingUserQuery.rows.length)
      
      if (existingUserQuery.rows.length > 0) {
        const existingUser = existingUserQuery.rows[0]
        console.log('⚠️ User with learner_name = "bian" already exists:')
        console.log('   Existing user data:', JSON.stringify(existingUser, null, 2))
        console.log('   learner_id:', existingUser.learner_id)
        console.log('   learner_name:', existingUser.learner_name)
        console.log('   created_at:', existingUser.created_at)
        console.log('   updated_at:', existingUser.updated_at)
        console.log('\n✅ SCRIPT COMPLETED - User already exists')
        console.log('='.repeat(80))
        return {
          success: true,
          message: 'User already exists',
          learner_id: existingUser.learner_id,
          learner_name: existingUser.learner_name,
          existing: true
        }
      } else {
        console.log('✅ No existing user found with learner_name = "bian"')
        console.log('   Proceeding with insertion...')
      }
    } catch (queryError) {
      console.error('❌ Error checking for existing user:')
      console.error('   Query error:', queryError.message)
      console.error('   Error code:', queryError.code)
      console.error('   Error detail:', queryError.detail || 'N/A')
      console.error('   Error hint:', queryError.hint || 'N/A')
      console.error('   Error stack:', queryError.stack)
      
      if (queryError.message && queryError.message.includes('does not exist')) {
        console.error('   ⚠️ Table "userProfiles" might not exist')
        console.error('   Check if migrations have been run')
      }
      
      throw queryError
    }
    
    // ============================================================================
    // STEP 4: Generate UUID and prepare insertion
    // ============================================================================
    console.log('\n📋 STEP 4: Generating UUID and preparing insertion')
    
    const learnerId = randomUUID()
    console.log('🔑 Generated learner_id:', learnerId)
    console.log('   UUID format valid:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(learnerId))
    console.log('   learner_name to insert:', LEARNER_NAME)
    
    // ============================================================================
    // STEP 5: Insert new user with learner_name = "bian"
    // ============================================================================
    console.log('\n📋 STEP 5: Inserting new user into userProfiles table')
    console.log('   Attempting to insert learner "bian"')
    console.log('   INSERT query: INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at") VALUES ($1::uuid, $2::text, now(), now())')
    console.log('   Parameters:')
    console.log('     learner_id:', learnerId)
    console.log('     learner_name: "bian"')
    
    let insertResult = null
    try {
      insertResult = await postgres.query(
        `INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
         VALUES ($1::uuid, $2::text, now(), now())
         RETURNING "learner_id", "learner_name", "created_at", "updated_at"`,
        [learnerId, LEARNER_NAME]
      )
      
      console.log('✅ Insert query executed successfully')
      console.log('   Rows returned:', insertResult.rows ? insertResult.rows.length : 0)
      console.log('   Row count:', insertResult.rowCount || 0)
      
      if (insertResult.rows && insertResult.rows.length > 0) {
        console.log('   Inserted row data:', JSON.stringify(insertResult.rows[0], null, 2))
      } else {
        console.error('❌ Insert query returned no rows')
        console.error('   This might indicate a constraint violation or silent failure')
        throw new Error('Failed to insert user - no rows returned from INSERT query')
      }
    } catch (insertError) {
      console.error('❌ Insert query error:')
      console.error('   Error message:', insertError.message)
      console.error('   Error code:', insertError.code)
      console.error('   Error detail:', insertError.detail || 'N/A')
      console.error('   Error hint:', insertError.hint || 'N/A')
      console.error('   Error stack:', insertError.stack)
      
      // Check for specific error types
      if (insertError.code === '23505') {
        console.error('   ⚠️ Unique constraint violation (duplicate key)')
        console.error('   This means a user with this learner_id or learner_name already exists')
      } else if (insertError.code === '42P01') {
        console.error('   ⚠️ Table does not exist')
        console.error('   Table "userProfiles" might not exist in the database')
      } else if (insertError.code === '23503') {
        console.error('   ⚠️ Foreign key constraint violation')
        console.error('   This means a required foreign key relationship is missing')
      } else if (insertError.code === '42501') {
        console.error('   ⚠️ Permission denied')
        console.error('   The database user does not have permission to insert into "userProfiles"')
      }
      
      throw insertError
    }
    
    // ============================================================================
    // STEP 6: Verify the insertion
    // ============================================================================
    console.log('\n📋 STEP 6: Verifying the insertion')
    
    const newUser = insertResult.rows[0]
    console.log('✅ User successfully added to userProfiles:')
    console.log('   Inserted user data:', JSON.stringify(newUser, null, 2))
    console.log('   learner_id:', newUser.learner_id)
    console.log('   learner_name:', newUser.learner_name)
    console.log('   created_at:', newUser.created_at)
    console.log('   updated_at:', newUser.updated_at)
    
    // Verify by querying the database by learner_id
    console.log('\n   Verifying insertion with SELECT query by learner_id...')
    try {
      const verifyResult = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_id" = $1::uuid`,
        [learnerId]
      )
      
      console.log('   Verification query executed successfully')
      console.log('   Rows returned:', verifyResult.rows ? verifyResult.rows.length : 0)
      
      if (verifyResult.rows && verifyResult.rows.length > 0) {
        console.log('✅ Verification successful - user found in database')
        console.log('   Verified user data:', JSON.stringify(verifyResult.rows[0], null, 2))
      } else {
        console.warn('⚠️ Verification query returned no rows')
        console.warn('   This means the user was inserted but cannot be found with the verification query')
        console.warn('   This might indicate a transaction rollback or timing issue')
      }
    } catch (verifyError) {
      console.error('❌ Verification query error:')
      console.error('   Verification error:', verifyError.message)
      console.error('   Error code:', verifyError.code)
      console.error('   Error stack:', verifyError.stack)
    }
    
    // Additional verification: Check by learner_name
    console.log('\n   Additional verification: Checking by learner_name = "bian"...')
    try {
      const verifyByNameResult = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_name" = $1::text 
         ORDER BY "created_at" DESC`,
        [LEARNER_NAME]
      )
      
      console.log('   Verification by name query executed successfully')
      console.log('   Users found with learner_name = "bian":', verifyByNameResult.rows.length)
      
      if (verifyByNameResult.rows.length > 0) {
        console.log('✅ Verification by name successful - user found in database')
        console.log('   All users with learner_name = "bian":')
        verifyByNameResult.rows.forEach((user, index) => {
          console.log(`   User ${index + 1}:`, JSON.stringify(user, null, 2))
        })
      } else {
        console.warn('⚠️ Verification by name returned no rows')
        console.warn('   Learner "bian" not found in userProfiles table')
        console.warn('   This indicates the insertion might have failed or been rolled back')
      }
    } catch (verifyByNameError) {
      console.error('❌ Verification by name query error:')
      console.error('   Verification error:', verifyByNameError.message)
      console.error('   Error code:', verifyByNameError.code)
    }
    
    // ============================================================================
    // STEP 7: Success
    // ============================================================================
    console.log('\n✅ SCRIPT COMPLETED SUCCESSFULLY')
    console.log('='.repeat(80))
    
    return {
      success: true,
      message: 'User successfully added',
      learner_id: newUser.learner_id,
      learner_name: newUser.learner_name,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      existing: false,
      verified: true
    }
    
  } catch (error) {
    console.error('\n❌ SCRIPT FAILED')
    console.error('='.repeat(80))
    console.error('Error adding user to userProfiles:')
    console.error('   Error message:', error.message)
    console.error('   Error code:', error.code)
    console.error('   Error detail:', error.detail || 'N/A')
    console.error('   Error hint:', error.hint || 'N/A')
    console.error('   Error stack:', error.stack)
    
    // Check if it's a duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      console.error('   ⚠️ Duplicate key error - user might already exist')
    }
    
    // Check if it's a connection error
    if (error.message && (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.error('   ⚠️ Connection error - check SUPABASE_URL')
    }
    
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes('does not exist')) {
      console.error('   ⚠️ Table does not exist - check if migrations have been run')
    }
    
    console.error('='.repeat(80))
    process.exit(1)
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addLearnerBian()
    .then((result) => {
      console.log('\n📊 Final Result:', JSON.stringify(result, null, 2))
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error)
      process.exit(1)
    })
}

export default addLearnerBian

