import express from 'express'
import { UserProfileModel } from '../../models/User.js'

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

// Get completed courses for a learner (must come before /:learnerId)
router.get('/:learnerId/completed-courses', async (req, res) => {
  try {
    const { learnerId } = req.params
    console.log('📋 [user-profiles] Fetching completed courses for learner:', learnerId)
    console.log('📋 [user-profiles] Request path:', req.path)
    console.log('📋 [user-profiles] Request URL:', req.url)
    
    const completedCourses = await UserProfileModel.getCompletedCourses(learnerId)
    console.log('✅ [user-profiles] Found completed courses:', completedCourses?.length || 0)

    res.json(completedCourses || [])
  } catch (error) {
    console.error('❌ [user-profiles] Error fetching completed courses:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

// Get active courses for a learner (must come before /:learnerId)
router.get('/:learnerId/active-courses', async (req, res) => {
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


export default router

