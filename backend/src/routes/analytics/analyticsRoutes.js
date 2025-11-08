import express from 'express'
import { authenticateToken } from '../../middleware/auth.js'
import { analyticsController } from '../../controllers/analyticsController.js'

const router = express.Router()

// Routes
router.get('/learner/:learnerId', authenticateToken, analyticsController.getLearnerAnalytics)
router.get('/course/:courseId', authenticateToken, analyticsController.getCourseAnalytics)
router.get('/dashboard', authenticateToken, analyticsController.getDashboard)

export default router

