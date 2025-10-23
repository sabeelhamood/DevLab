import express from 'express'
import { param } from 'express-validator'
import { authenticateToken } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validateRequest'
import { analyticsController } from '../../controllers/analyticsController'

const router = express.Router()

// Routes
router.get('/learner/:learnerId', authenticateToken, analyticsController.getLearnerAnalytics)
router.get('/course/:courseId', authenticateToken, analyticsController.getCourseAnalytics)
router.get('/dashboard', authenticateToken, analyticsController.getDashboard)

export default router




