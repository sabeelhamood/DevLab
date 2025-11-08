import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { hrReportingController } from '../../controllers/external/hrReportingController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/practice-level', hrReportingController.sendPracticeLevel)
router.post('/competencies', hrReportingController.sendCompetencies)
router.get('/reports/:orgId', hrReportingController.getHRReports)

export default router

