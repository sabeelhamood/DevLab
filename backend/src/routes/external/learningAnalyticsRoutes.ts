import express from 'express'
import { authenticateService } from '../../middleware/auth'
import { learningAnalyticsController } from '../../controllers/external/learningAnalyticsController'

const router = express.Router()
router.use(authenticateService)

router.post('/session-complete', learningAnalyticsController.sendSessionCompletion)
router.post('/performance', learningAnalyticsController.sendPerformanceMetrics)
router.get('/learner/:learnerId', learningAnalyticsController.getLearnerAnalytics)

export default router




