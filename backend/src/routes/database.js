import express from 'express'
import { UserModel } from '../models/User.js'
import { CourseModel } from '../models/Course.js'
import { QuestionModel } from '../models/Question.js'
import { LogModel } from '../models/Log.js'
import { AnalyticsModel } from '../models/Analytics.js'

const router = express.Router()

// Test database connections
router.get('/test', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      databases: {}
    }

    // Test PostgreSQL (Supabase)
    try {
      const { supabase } = await import('../config/database.js')
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (error) throw error
      results.databases.postgresql = { status: 'connected', message: 'Supabase PostgreSQL connected' }
    } catch (error) {
      results.databases.postgresql = { status: 'error', message: error.message }
    }

    // Test MongoDB Atlas
    try {
      const { getMongoDB } = await import('../config/database.js')
      const db = getMongoDB()
      await db.admin().ping()
      results.databases.mongodb = { status: 'connected', message: 'MongoDB Atlas connected' }
    } catch (error) {
      results.databases.mongodb = { status: 'error', message: error.message }
    }

    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Test PostgreSQL operations
router.get('/test/postgresql', async (req, res) => {
  try {
    // Test user operations
    const testUser = {
      email: 'test@devlab.com',
      name: 'Test User',
      role: 'learner',
      organization_id: 1
    }

    // Try to create a test user
    const user = await UserModel.create(testUser)
    
    res.json({
      message: 'PostgreSQL operations successful',
      user: user,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'PostgreSQL operations failed',
      message: error.message 
    })
  }
})

// Test MongoDB operations
router.get('/test/mongodb', async (req, res) => {
  try {
    // Test log creation
    const testLog = {
      level: 'info',
      message: 'Database test log entry',
      service: 'devlab-backend',
      user_id: 'test-user-123'
    }

    const log = await LogModel.create(testLog)
    
    // Test analytics creation
    const testAnalytics = {
      event_type: 'test_event',
      user_id: 'test-user-123',
      course_id: 1,
      metadata: { test: true }
    }

    const analytics = await AnalyticsModel.create(testAnalytics)
    
    res.json({
      message: 'MongoDB operations successful',
      log: log,
      analytics: analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'MongoDB operations failed',
      message: error.message 
    })
  }
})

// Get database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      postgresql: {},
      mongodb: {}
    }

    // PostgreSQL stats
    try {
      const { supabase } = await import('../config/database.js')
      
      // Get user count
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      // Get course count
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
      
      stats.postgresql = {
        users: userCount,
        courses: courseCount
      }
    } catch (error) {
      stats.postgresql = { error: error.message }
    }

    // MongoDB stats
    try {
      const { getCollections } = await import('../config/database.js')
      const { logs, analytics, errors } = getCollections()
      
      const [logCount, analyticsCount, errorCount] = await Promise.all([
        logs.countDocuments(),
        analytics.countDocuments(),
        errors.countDocuments()
      ])
      
      stats.mongodb = {
        logs: logCount,
        analytics: analyticsCount,
        errors: errorCount
      }
    } catch (error) {
      stats.mongodb = { error: error.message }
    }

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router


