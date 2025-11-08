import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { assistantController } from '../../controllers/external/assistantController.js'

const router = express.Router()
router.use(authenticateService)

router.post('/performance', assistantController.sendPerformanceData)
router.get('/chatbot-config', assistantController.getChatbotConfig)
router.post('/feedback', assistantController.sendLearnerFeedback)

export default router

