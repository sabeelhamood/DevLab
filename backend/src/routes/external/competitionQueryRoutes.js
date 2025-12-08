import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { competitionController } from '../../controllers/competitionController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/query', competitionController.queryAnalyticsData)

export default router


