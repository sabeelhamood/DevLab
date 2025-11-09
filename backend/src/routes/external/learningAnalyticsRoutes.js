import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { learningAnalyticsController } from '../../controllers/external/learningAnalyticsController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/competition-summary', learningAnalyticsController.sendCompetitionSummary)

export default router

