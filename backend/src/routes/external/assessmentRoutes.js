import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { assessmentController } from '../../controllers/external/assessmentController.js'

const router = express.Router()
router.use(authenticateService)

router.get('/theoretical', assessmentController.getTheoreticalQuestions)
router.post('/code', assessmentController.sendCodeQuestions)
router.put('/:questionId/status', assessmentController.updateQuestionStatus)
router.post('/confirm-questions', assessmentController.confirmQuestions)
router.post('/grade', assessmentController.gradeAssessmentSolutions)

export default router

