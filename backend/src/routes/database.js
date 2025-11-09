import express from 'express'
import { postgres } from '../config/database.js'
import { LogModel } from '../models/Log.js'
import { AnalyticsModel } from '../models/Analytics.js'

const router = express.Router()

router.get('/test', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      databases: {}
    }

    try {
      await postgres.query('SELECT 1')
      results.databases.postgresql = {
        status: 'connected',
        message: 'PostgreSQL connection successful'
      }
    } catch (error) {
      results.databases.postgresql = {
        status: 'error',
        message: error.message
      }
    }

    try {
      const { getMongoDB } = await import('../config/database.js')
      const db = getMongoDB()
      await db.admin().ping()
      results.databases.mongodb = {
        status: 'connected',
        message: 'MongoDB Atlas connection successful'
      }
    } catch (error) {
      results.databases.mongodb = {
        status: 'error',
        message: error.message
      }
    }

    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/test/postgresql', async (req, res) => {
  try {
    const { rows } = await postgres.query('SELECT now() AS timestamp')
    res.json({
      message: 'PostgreSQL query executed successfully',
      timestamp: rows[0]?.timestamp ?? new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'PostgreSQL operations failed',
      message: error.message
    })
  }
})

router.get('/test/mongodb', async (req, res) => {
  try {
    const log = await LogModel.create({
      level: 'info',
      message: 'Database test log entry',
      service: 'devlab-backend',
      user_id: 'test-user-123'
    })

    const analytics = await AnalyticsModel.create({
      event_type: 'test_event',
      user_id: 'test-user-123',
      course_id: 1,
      metadata: { test: true }
    })

    res.json({
      message: 'MongoDB operations successful',
      log,
      analytics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      error: 'MongoDB operations failed',
      message: error.message
    })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const stats = {
      timestamp: new Date().toISOString(),
      postgresql: {},
      mongodb: {}
    }

    try {
      const [{ rows: userRows }, { rows: courseRows }] = await Promise.all([
        postgres.query('SELECT COUNT(*)::integer AS count FROM "userProfiles"'),
        postgres.query('SELECT COUNT(*)::integer AS count FROM "courses"')
      ])

      stats.postgresql = {
        users: userRows[0]?.count ?? 0,
        courses: courseRows[0]?.count ?? 0
      }
    } catch (error) {
      stats.postgresql = { error: error.message }
    }

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

