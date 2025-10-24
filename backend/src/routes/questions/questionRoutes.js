import express from 'express'
import { body } from 'express-validator'
import { authenticateToken, requireRole } from '../../middleware/auth.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { questionController } from '../../controllers/questionController.js'
import { QuestionModel } from '../../models/Question.js'

const router = express.Router()

// Validation rules
const questionValidation = [
  body('question_content').trim().isLength({ min: 10 }).withMessage('Question content must be at least 10 characters'),
  body('question_type').isIn(['code', 'theoretical']).withMessage('Question type must be code or theoretical'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty level'),
  body('course_id').trim().notEmpty().withMessage('Course ID is required'),
  body('topic_id').trim().notEmpty().withMessage('Topic ID is required'),
  body('practice_id').optional().trim().notEmpty().withMessage('Practice ID is optional'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
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

// New routes for updated schema
router.get('/practice/:practiceId', async (req, res) => {
  try {
    const { practiceId } = req.params
    const questions = await QuestionModel.findByPractice(practiceId)
    res.json(questions)
  } catch (error) {
    console.error('Error fetching questions by practice:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/type/:questionType', async (req, res) => {
  try {
    const { questionType } = req.params
    const { limit = 10 } = req.query
    const questions = await QuestionModel.findByType(questionType, parseInt(limit))
    res.json(questions)
  } catch (error) {
    console.error('Error fetching questions by type:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/tags/:tags', async (req, res) => {
  try {
    const { tags } = req.params
    const tagsArray = tags.split(',')
    const { limit = 10 } = req.query
    const questions = await QuestionModel.findByTags(tagsArray, parseInt(limit))
    res.json(questions)
  } catch (error) {
    console.error('Error fetching questions by tags:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/random/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const { count = 4, difficulty, questionType } = req.query
    const questions = await QuestionModel.getRandomQuestions(
      topicId, 
      parseInt(count), 
      difficulty, 
      questionType
    )
    res.json(questions)
  } catch (error) {
    console.error('Error fetching random questions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

