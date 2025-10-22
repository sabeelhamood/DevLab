import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticateToken, requireRole } from '../../middleware/auth'
import { validateRequest } from '../../middleware/validateRequest'
import { questionController } from '../../controllers/questionController'

const router = express.Router()

// Validation rules
const questionValidation = [
  body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('type').isIn(['code', 'theoretical']).withMessage('Type must be code or theoretical'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('courseId').trim().notEmpty().withMessage('Course ID is required'),
  body('topicId').trim().notEmpty().withMessage('Topic ID is required'),
]

const submissionValidation = [
  body('solution').trim().isLength({ min: 1 }).withMessage('Solution is required'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
]

// Routes
router.get('/personalized', authenticateToken, questionController.getPersonalizedQuestions)
router.get('/:id', authenticateToken, questionController.getQuestion)
router.post('/:id/submit', authenticateToken, submissionValidation, validateRequest, questionController.submitAnswer)
router.get('/:id/feedback', authenticateToken, questionController.getFeedback)
router.post('/:id/hint', authenticateToken, questionController.requestHint)
router.get('/:id/solution', authenticateToken, questionController.getSolution)

// Trainer routes
router.post('/', authenticateToken, requireRole(['trainer', 'admin']), questionValidation, validateRequest, questionController.createQuestion)
router.put('/:id', authenticateToken, requireRole(['trainer', 'admin']), questionValidation, validateRequest, questionController.updateQuestion)
router.delete('/:id', authenticateToken, requireRole(['trainer', 'admin']), questionController.deleteQuestion)
router.get('/course/:courseId', authenticateToken, questionController.getQuestionsByCourse)
router.post('/:id/validate', authenticateToken, requireRole(['trainer', 'admin']), questionController.validateQuestion)

export default router
