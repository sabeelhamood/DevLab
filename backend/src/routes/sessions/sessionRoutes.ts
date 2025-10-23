import express from 'express'
import { body, param } from 'express-validator'
import { authenticateToken } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validateRequest'
import { sessionController } from '../../controllers/sessionController'

const router = express.Router()

// Validation rules
const startSessionValidation = [
  body('courseId').trim().notEmpty().withMessage('Course ID is required'),
  body('sessionType').isIn(['practice', 'competition']).withMessage('Invalid session type'),
  body('questionTypes').optional().isArray().withMessage('Question types must be an array'),
]

const submitAnswerValidation = [
  body('questionId').trim().notEmpty().withMessage('Question ID is required'),
  body('answer').trim().isLength({ min: 1 }).withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
]

// Routes
router.post('/start', authenticateToken, startSessionValidation, validateRequest, sessionController.startSession)
router.get('/:id', authenticateToken, sessionController.getSession)
router.post('/:id/submit', authenticateToken, submitAnswerValidation, validateRequest, sessionController.submitAnswer)
router.post('/:id/complete', authenticateToken, sessionController.completeSession)
router.post('/:id/pause', authenticateToken, sessionController.pauseSession)
router.post('/:id/resume', authenticateToken, sessionController.resumeSession)
router.get('/history/:learnerId', authenticateToken, sessionController.getSessionHistory)
router.get('/:id/analytics', authenticateToken, sessionController.getSessionAnalytics)

export default router




