import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { competitionController } from '../../controllers/competitionController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/send-summary', competitionController.sendCompetitionSummary)

export default router

