import express from 'express'
import { UserProfileModel } from '../../models/User.js'
import { postgres } from '../../config/database.js'
import { randomUUID } from 'node:crypto'

const router = express.Router()

// Get all user profiles with pagination (must come before /:learnerId)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const result = await UserProfileModel.findAll(parseInt(page, 10), parseInt(limit, 10))

    res.json(result)
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get completed courses for a learner
// Use /completed-courses/:learnerId pattern to avoid route matching issues
router.get('/completed-courses/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    
    console.log('📋 [user-profiles] Fetching completed courses for learner:', learnerId)
    
    const completedCourses = await UserProfileModel.getCompletedCourses(learnerId)
    console.log('✅ [user-profiles] Found completed courses:', completedCourses?.length || 0)

    res.json(completedCourses || [])
  } catch (error) {
    console.error('❌ [user-profiles] Error fetching completed courses:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

// Get active courses for a learner
router.get('/active-courses/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    const completedCourses = await UserProfileModel.getCompletedCourses(learnerId)

    res.json(completedCourses || [])
  } catch (error) {
    console.error('Error fetching active courses:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user profile by learner ID (must come after specific routes)
router.get('/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    const userProfile = await UserProfileModel.findById(learnerId)

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    res.json(userProfile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new user profile
router.post('/', async (req, res) => {
  try {
    const { learner_id: learnerId, learner_name: learnerName } = req.body

    if (!learnerId) {
      return res.status(400).json({ error: 'Missing required field: learner_id' })
    }

    const userProfile = await UserProfileModel.create({
      learner_id: learnerId,
      learner_name: learnerName
    })
    res.status(201).json(userProfile)
  } catch (error) {
    console.error('Error creating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile metadata
router.put('/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    const { learner_name: learnerName } = req.body

    const updatedProfile = await UserProfileModel.update(learnerId, {
      learner_name: learnerName
    })
    res.json(updatedProfile)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user profile
router.delete('/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params

    await UserProfileModel.delete(learnerId)
    res.json({ message: 'User profile deleted successfully' })
  } catch (error) {
    console.error('Error deleting user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})


// Test endpoint to add user with learner_name = "bian"
// This endpoint uses the Railway SUPABASE_URL to connect to Supabase
// POST /api/user-profiles/test/add-bian
router.post('/test/add-bian', async (req, res) => {
  console.log('='.repeat(80))
  console.log('🔍 TEST ENDPOINT: Adding user with learner_name = "bian"')
  console.log('='.repeat(80))
  
  try {
    // ============================================================================
    // STEP 1: Verify PostgreSQL connection and SUPABASE_URL
    // ============================================================================
    console.log('\n📋 STEP 1: Verifying PostgreSQL connection and SUPABASE_URL')
    
    // Log SUPABASE_URL (masked for security)
    const supabaseUrl = process.env.SUPABASE_URL
    if (supabaseUrl) {
      // Mask password in URL for logging
      const maskedUrl = supabaseUrl.replace(/:([^:@]+)@/, ':****@')
      console.log('✅ SUPABASE_URL is defined:', maskedUrl)
      console.log('   URL length:', supabaseUrl.length, 'characters')
      console.log('   URL starts with:', supabaseUrl.substring(0, 20) + '...')
    } else {
      console.error('❌ SUPABASE_URL is NOT defined in process.env')
      console.error('   This means the environment variable is not set in Railway')
      return res.status(500).json({
        success: false,
        error: 'SUPABASE_URL not configured',
        message: 'SUPABASE_URL environment variable is not set in Railway'
      })
    }
    
    // Test connection with SELECT NOW()
    console.log('\n📡 Testing PostgreSQL connection with SELECT NOW()...')
    try {
      const connectionTest = await postgres.query('SELECT NOW() as current_time, 1 as test')
      console.log('✅ PostgreSQL connection test successful')
      console.log('   Connection test result:', JSON.stringify(connectionTest.rows[0], null, 2))
      console.log('   Current database time:', connectionTest.rows[0].current_time)
    } catch (connectionError) {
      console.error('❌ PostgreSQL connection test FAILED')
      console.error('   Connection error:', connectionError.message)
      console.error('   Error code:', connectionError.code)
      console.error('   Error stack:', connectionError.stack)
      return res.status(500).json({
        success: false,
        error: 'Database connection failed',
        message: connectionError.message,
        code: connectionError.code
      })
    }
    
    // ============================================================================
    // STEP 2: Check if user "bian" already exists
    // ============================================================================
    console.log('\n📋 STEP 2: Checking if user with learner_name = "bian" already exists')
    
    let existingUser = null
    try {
      console.log('   Executing SELECT query: SELECT * FROM "userProfiles" WHERE "learner_name" = \'bian\'')
      const existingUserQuery = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_name" = $1::text 
         LIMIT 1`,
        ['bian']
      )
      
      console.log('   Query executed successfully')
      console.log('   Rows returned:', existingUserQuery.rows.length)
      
      if (existingUserQuery.rows.length > 0) {
        existingUser = existingUserQuery.rows[0]
        console.log('⚠️ User with learner_name = "bian" already exists:')
        console.log('   Existing user data:', JSON.stringify(existingUser, null, 2))
        console.log('   learner_id:', existingUser.learner_id)
        console.log('   learner_name:', existingUser.learner_name)
        console.log('   created_at:', existingUser.created_at)
        console.log('   updated_at:', existingUser.updated_at)
        
        return res.json({
          success: true,
          message: 'User already exists',
          learner_id: existingUser.learner_id,
          learner_name: existingUser.learner_name,
          created_at: existingUser.created_at,
          updated_at: existingUser.updated_at,
          existing: true,
          connection: 'Railway SUPABASE_URL',
          query_result: 'User found in database'
        })
      } else {
        console.log('✅ No existing user found with learner_name = "bian"')
        console.log('   Proceeding with insertion...')
      }
    } catch (queryError) {
      console.error('❌ Error checking for existing user:')
      console.error('   Query error:', queryError.message)
      console.error('   Error code:', queryError.code)
      console.error('   Error stack:', queryError.stack)
      
      // Check if it's a table doesn't exist error
      if (queryError.message && queryError.message.includes('does not exist')) {
        console.error('   ⚠️ Table "userProfiles" might not exist')
        console.error('   Check if migrations have been run')
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to check for existing user',
        message: queryError.message,
        code: queryError.code
      })
    }
    
    // ============================================================================
    // STEP 3: Generate UUID and prepare insertion
    // ============================================================================
    console.log('\n📋 STEP 3: Generating UUID and preparing insertion')
    
    const learnerId = randomUUID()
    console.log('🔑 Generated learner_id:', learnerId)
    console.log('   UUID format valid:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(learnerId))
    console.log('   learner_name to insert:', 'bian')
    
    // ============================================================================
    // STEP 4: Insert new user with learner_name = "bian"
    // ============================================================================
    console.log('\n📋 STEP 4: Inserting new user into userProfiles table')
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
        [learnerId, 'bian']
      )
      
      console.log('✅ Insert query executed successfully')
      console.log('   Insert query result:', JSON.stringify(insertResult, null, 2))
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
      console.error('   Error detail:', insertError.detail)
      console.error('   Error hint:', insertError.hint)
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
      
      return res.status(500).json({
        success: false,
        error: 'Failed to insert user',
        message: insertError.message,
        code: insertError.code,
        detail: insertError.detail,
        hint: insertError.hint
      })
    }
    
    // ============================================================================
    // STEP 5: Verify the insertion
    // ============================================================================
    console.log('\n📋 STEP 5: Verifying the insertion')
    
    const newUser = insertResult.rows[0]
    console.log('✅ User successfully added to userProfiles:')
    console.log('   Inserted user data:', JSON.stringify(newUser, null, 2))
    console.log('   learner_id:', newUser.learner_id)
    console.log('   learner_name:', newUser.learner_name)
    console.log('   created_at:', newUser.created_at)
    console.log('   updated_at:', newUser.updated_at)
    
    // Verify by querying the database
    console.log('\n   Verifying insertion with SELECT query...')
    try {
      const verifyResult = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_id" = $1::uuid`,
        [learnerId]
      )
      
      console.log('   Verification query executed successfully')
      console.log('   Verification query result:', JSON.stringify(verifyResult, null, 2))
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
        ['bian']
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
    // STEP 6: Check table schema
    // ============================================================================
    console.log('\n📋 STEP 6: Checking table schema')
    try {
      const schemaCheck = await postgres.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'userProfiles'
        ORDER BY ordinal_position
      `)
      
      console.log('✅ Table schema check successful')
      console.log('   Table "userProfiles" columns:', schemaCheck.rows.length)
      schemaCheck.rows.forEach((col, index) => {
        console.log(`   Column ${index + 1}:`, JSON.stringify(col, null, 2))
      })
    } catch (schemaError) {
      console.error('❌ Table schema check error:')
      console.error('   Schema error:', schemaError.message)
    }
    
    // ============================================================================
    // STEP 7: Return success response
    // ============================================================================
    console.log('\n✅ TEST ENDPOINT COMPLETED SUCCESSFULLY')
    console.log('='.repeat(80))
    
    return res.json({
      success: true,
      message: 'User successfully added',
      learner_id: newUser.learner_id,
      learner_name: newUser.learner_name,
      created_at: newUser.created_at,
      updated_at: newUser.updated_at,
      existing: false,
      connection: 'Railway SUPABASE_URL',
      verified: true,
      supabase_url_configured: !!supabaseUrl,
      connection_test: 'passed',
      insertion: 'successful',
      verification: 'passed'
    })
    
  } catch (error) {
    console.error('\n❌ TEST ENDPOINT FAILED')
    console.error('='.repeat(80))
    console.error('Error adding user to userProfiles:')
    console.error('   Error message:', error.message)
    console.error('   Error code:', error.code)
    console.error('   Error detail:', error.detail)
    console.error('   Error hint:', error.hint)
    console.error('   Error stack:', error.stack)
    
    // Check if it's a duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      console.error('   ⚠️ Duplicate key error - user might already exist')
    }
    
    // Check if it's a connection error
    if (error.message && (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.error('   ⚠️ Connection error - check SUPABASE_URL in Railway')
    }
    
    // Check if it's a table doesn't exist error
    if (error.message && error.message.includes('does not exist')) {
      console.error('   ⚠️ Table does not exist - check if migrations have been run')
    }
    
    console.error('='.repeat(80))
    
    return res.status(500).json({
      success: false,
      error: 'Failed to add user',
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      connection: 'Railway SUPABASE_URL',
      supabase_url_configured: !!process.env.SUPABASE_URL
    })
  }
})

export default router

