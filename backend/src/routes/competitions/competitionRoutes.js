import express from 'express'
import { authenticateToken } from '../../middleware/auth.js'
import { competitionController } from '../../controllers/competitionController.js'

const router = express.Router()

router.post('/course-completion', competitionController.recordCourseCompletion)
router.post('/create', competitionController.createAICompetition)
router.get('/pending/:learnerId', competitionController.getPendingAICompetitions)
router.post('/start/:competitionId', authenticateToken, competitionController.startAICompetition)
router.post('/:competitionId/answer', authenticateToken, competitionController.recordAICompetitionAnswer)
router.post('/:competitionId/complete', authenticateToken, competitionController.completeAICompetition)

export default router

