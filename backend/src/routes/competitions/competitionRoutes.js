import express from 'express'
import { authenticateToken } from '../../middleware/auth.js'
import { competitionController } from '../../controllers/competitionController.js'

const router = express.Router()

const competitionAuth =
  process.env.DISABLE_COMPETITION_AUTH === 'true'
    ? (req, _res, next) => next()
    : authenticateToken

router.post('/course-completion', competitionController.recordCourseCompletion)
router.post('/create', competitionController.createAICompetition)
router.get('/pending/:learnerId', competitionController.getPendingAICompetitions)
router.post('/start/:competitionId', competitionAuth, competitionController.startAICompetition)
router.post('/:competitionId/answer', competitionAuth, competitionController.recordAICompetitionAnswer)
router.post('/:competitionId/complete', competitionAuth, competitionController.completeAICompetition)

export default router

