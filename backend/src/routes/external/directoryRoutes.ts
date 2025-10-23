import express from 'express'
import { param } from 'express-validator'
import { authenticateService } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validateRequest'
import { directoryController } from '../../controllers/external/directoryController'

const router = express.Router()

// All routes require service authentication
router.use(authenticateService)

// Routes
router.get('/:learnerId', directoryController.getLearnerProfile)
router.post('/:learnerId/quota', directoryController.updateLearnerQuota)
router.get('/organizations/:orgId/mapping', directoryController.getOrganizationMapping)

export default router




