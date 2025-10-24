import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { directoryController } from '../../controllers/external/directoryController.js'

const router = express.Router()

// All routes require service authentication
router.use(authenticateService)

// Routes
router.get('/:learnerId', directoryController.getLearnerProfile)
router.post('/:learnerId/quota', directoryController.updateLearnerQuota)
router.get('/organizations/:orgId/mapping', directoryController.getOrganizationMapping)

export default router

