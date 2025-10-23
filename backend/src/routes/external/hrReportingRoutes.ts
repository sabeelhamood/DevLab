import express from 'express'
import { authenticateService } from '../../middleware/auth'
import { hrReportingController } from '../../controllers/external/hrReportingController'

const router = express.Router()
router.use(authenticateService)

router.post('/practice-level', hrReportingController.sendPracticeLevel)
router.post('/competencies', hrReportingController.sendCompetencies)
router.get('/reports/:orgId', hrReportingController.getHRReports)

export default router




