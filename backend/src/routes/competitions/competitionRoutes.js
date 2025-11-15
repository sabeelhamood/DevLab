import express from 'express'
import { competitionController } from '../../controllers/competitionController.js'

const router = express.Router()

router.post('/course-completion', competitionController.recordCourseCompletion)
router.post('/create', competitionController.createAICompetition)
router.get('/pending/:learnerId', competitionController.getPendingAICompetitions)

export default router

