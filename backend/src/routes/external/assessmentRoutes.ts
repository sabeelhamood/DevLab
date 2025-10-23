import express from 'express'
import { authenticateService } from '../../middleware/auth'
import { assessmentController } from '../../controllers/external/assessmentController'

const router = express.Router()
router.use(authenticateService)

router.get('/theoretical', assessmentController.getTheoreticalQuestions)
router.post('/code', assessmentController.sendCodeQuestions)
router.put('/:questionId/status', assessmentController.updateQuestionStatus)

export default router




