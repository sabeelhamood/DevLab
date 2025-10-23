import express from 'express'
import { UserProfileModel } from '../../models/User.js'

const router = express.Router()

// Get user profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const userProfile = await UserProfileModel.findById(userId)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    res.json(userProfile)
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user profile by email
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params
    const userProfile = await UserProfileModel.findByEmail(email)
    
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    
    res.json(userProfile)
  } catch (error) {
    console.error('Error fetching user profile by email:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new user profile
router.post('/', async (req, res) => {
  try {
    const userData = req.body
    
    // Validate required fields
    if (!userData.user_id || !userData.name || !userData.email || !userData.role) {
      return res.status(400).json({ 
        error: 'Missing required fields: user_id, name, email, role' 
      })
    }
    
    const userProfile = await UserProfileModel.create(userData)
    res.status(201).json(userProfile)
  } catch (error) {
    console.error('Error creating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user profile
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const updateData = req.body
    
    const updatedProfile = await UserProfileModel.update(userId, updateData)
    res.json(updatedProfile)
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user profile
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    await UserProfileModel.delete(userId)
    res.json({ message: 'User profile deleted successfully' })
  } catch (error) {
    console.error('Error deleting user profile:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get users by organization
router.get('/organization/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params
    const users = await UserProfileModel.findByOrganization(organizationId)
    
    res.json(users)
  } catch (error) {
    console.error('Error fetching users by organization:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get users by role
router.get('/role/:role', async (req, res) => {
  try {
    const { role } = req.params
    const users = await UserProfileModel.findByRole(role)
    
    res.json(users)
  } catch (error) {
    console.error('Error fetching users by role:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get completed courses for a user
router.get('/:userId/completed-courses', async (req, res) => {
  try {
    const { userId } = req.params
    const completedCourses = await UserProfileModel.getCompletedCourses(userId)
    
    res.json(completedCourses)
  } catch (error) {
    console.error('Error fetching completed courses:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get active courses for a user
router.get('/:userId/active-courses', async (req, res) => {
  try {
    const { userId } = req.params
    const activeCourses = await UserProfileModel.getActiveCourses(userId)
    
    res.json(activeCourses)
  } catch (error) {
    console.error('Error fetching active courses:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all user profiles with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const result = await UserProfileModel.findAll(parseInt(page), parseInt(limit))
    
    res.json(result)
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

