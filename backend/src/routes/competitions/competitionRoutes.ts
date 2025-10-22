import express from 'express'
import { body, param } from 'express-validator'
import { authenticateToken } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validateRequest'
import { competitionController } from '../../controllers/competitionController'

const router = express.Router()

// Validation rules
const joinCompetitionValidation = [
  body('courseId').trim().notEmpty().withMessage('Course ID is required'),
]

const submitAnswerValidation = [
  body('questionId').trim().notEmpty().withMessage('Question ID is required'),
  body('answer').trim().isLength({ min: 1 }).withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
]

// Routes
router.post('/join', authenticateToken, joinCompetitionValidation, validateRequest, competitionController.joinCompetition)
router.get('/:id', authenticateToken, competitionController.getCompetition)
router.post('/:id/submit', authenticateToken, submitAnswerValidation, validateRequest, competitionController.submitAnswer)
router.get('/:id/results', authenticateToken, competitionController.getResults)
router.get('/leaderboard/:courseId', authenticateToken, competitionController.getLeaderboard)

export default router
