import express from 'express'
import { authenticateService } from '../../middleware/auth.js'
import { assessmentController } from '../../controllers/external/assessmentController.js'

const router = express.Router()
router.use(authenticateService)

router.get('/theoretical', assessmentController.getTheoreticalQuestions)
router.post('/code', assessmentController.sendCodeQuestions)
router.post('/confirm-questions', assessmentController.confirmQuestions)
router.post('/grade', assessmentController.gradeAssessmentSolutions)
router.delete('/code-questions/:assessmentId', assessmentController.deleteCodeQuestions)
router.put('/:questionId/status', assessmentController.updateQuestionStatus)

export default router

