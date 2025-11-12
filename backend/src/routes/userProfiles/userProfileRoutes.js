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
// POST /api/userProfiles/test/add-bian
router.post('/test/add-bian', async (req, res) => {
  try {
    console.log('🔍 Test endpoint: Adding user with learner_name = "bian"')
    console.log('📋 Using SUPABASE_URL from Railway environment variables')
    
    // Test connection first
    const connectionTest = await postgres.query('SELECT 1 as test')
    console.log('✅ Supabase connection test successful:', connectionTest.rows[0])
    
    // Check if user with name "bian" already exists
    const existingUser = await postgres.query(
      `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
       FROM "userProfiles" 
       WHERE "learner_name" = $1::text 
       LIMIT 1`,
      ['bian']
    )
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️ User with learner_name = "bian" already exists:')
      console.log(`   learner_id: ${existingUser.rows[0].learner_id}`)
      console.log(`   learner_name: ${existingUser.rows[0].learner_name}`)
      
      return res.json({
        success: true,
        message: 'User already exists',
        learner_id: existingUser.rows[0].learner_id,
        learner_name: existingUser.rows[0].learner_name,
        created_at: existingUser.rows[0].created_at,
        updated_at: existingUser.rows[0].updated_at,
        existing: true
      })
    }
    
    // Generate UUID for learner_id
    const learnerId = randomUUID()
    console.log(`🔑 Generated learner_id: ${learnerId}`)
    
    // Insert new user with learner_name = "bian"
    console.log('📝 Inserting new user...')
    const insertResult = await postgres.query(
      `INSERT INTO "userProfiles" ("learner_id", "learner_name", "created_at", "updated_at")
       VALUES ($1::uuid, $2::text, now(), now())
       RETURNING "learner_id", "learner_name", "created_at", "updated_at"`,
      [learnerId, 'bian']
    )
    
    if (insertResult.rows.length > 0) {
      const newUser = insertResult.rows[0]
      console.log('✅ User successfully added to userProfiles:')
      console.log(`   learner_id: ${newUser.learner_id}`)
      console.log(`   learner_name: ${newUser.learner_name}`)
      console.log(`   created_at: ${newUser.created_at}`)
      console.log(`   updated_at: ${newUser.updated_at}`)
      
      // Verify the insertion
      const verifyResult = await postgres.query(
        `SELECT "learner_id", "learner_name", "created_at", "updated_at" 
         FROM "userProfiles" 
         WHERE "learner_id" = $1::uuid`,
        [learnerId]
      )
      
      if (verifyResult.rows.length > 0) {
        console.log('✅ Verification successful - user found in database')
        console.log('📊 User details:', JSON.stringify(verifyResult.rows[0], null, 2))
      }
      
      return res.json({
        success: true,
        message: 'User successfully added',
        learner_id: newUser.learner_id,
        learner_name: newUser.learner_name,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
        existing: false,
        connection: 'Railway SUPABASE_URL',
        verified: verifyResult.rows.length > 0
      })
    } else {
      throw new Error('Failed to insert user - no rows returned')
    }
    
  } catch (error) {
    console.error('❌ Error adding user to userProfiles:')
    console.error('   Error message:', error.message)
    console.error('   Error stack:', error.stack)
    
    // Check if it's a duplicate key error
    if (error.message && error.message.includes('duplicate key')) {
      console.error('   ⚠️ Duplicate key error - user might already exist')
    }
    
    // Check if it's a connection error
    if (error.message && (error.message.includes('connection') || error.message.includes('timeout'))) {
      console.error('   ⚠️ Connection error - check SUPABASE_URL in Railway')
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to add user',
      message: error.message,
      connection: 'Railway SUPABASE_URL'
    })
  }
})

export default router

