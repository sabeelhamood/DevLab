import express from 'express'
import { body } from 'express-validator'
import { authenticateToken } from '../../middleware/auth.js'
import { validateRequest } from '../../middleware/validateRequest.js'
import { competitionController } from '../../controllers/competitionController.js'
import { CompetitionModel } from '../../models/Competition.js'

const router = express.Router()

// Validation rules
const joinCompetitionValidation = [
  body('course_id').trim().notEmpty().withMessage('Course ID is required'),
  body('learner1_id').trim().notEmpty().withMessage('Learner 1 ID is required'),
  body('learner2_id').trim().notEmpty().withMessage('Learner 2 ID is required'),
]

const submitAnswerValidation = [
  body('questionId').trim().notEmpty().withMessage('Question ID is required'),
  body('answer').trim().isLength({ min: 1 }).withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
]

const updateResultValidation = [
  body('result').isObject().withMessage('Result must be an object'),
]

// Routes
router.post('/invite', authenticateToken, competitionController.createInvitation)
router.post('/invitation/:invitationId/respond', authenticateToken, competitionController.respondToInvitation)
router.post('/join', authenticateToken, joinCompetitionValidation, validateRequest, competitionController.joinCompetition)
// Specific routes must come before parameterized routes like /:id
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const competitions = await CompetitionModel.findByCourse(courseId)

    res.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions by course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get competitions by learner ID
router.get('/learner/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    
    if (!learnerId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Learner ID is required' 
      })
    }

    console.log('📋 Fetching competitions for learner:', learnerId)
    const competitions = await CompetitionModel.findByLearner(learnerId)
    console.log('✅ Found competitions:', competitions?.length || 0)

    if (!competitions || competitions.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: 'No competitions found for this learner' 
      })
    }

    res.status(200).json({ 
      success: true, 
      data: competitions 
    })
  } catch (error) {
    console.error('❌ Error fetching competitions by learner:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error', 
      message: error.message 
    })
  }
})

router.get('/active/all', async (req, res) => {
  try {
    const competitions = await CompetitionModel.getActive()
    res.json(competitions)
  } catch (error) {
    console.error('Error fetching active competitions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/completed/all', async (req, res) => {
  try {
    const competitions = await CompetitionModel.getCompleted()
    res.json(competitions)
  } catch (error) {
    console.error('Error fetching completed competitions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get competition by ID - no auth required for viewing
// This must come AFTER all specific routes like /course/:courseId, /learner/:learnerId, etc.
router.get('/:id', async (req, res, next) => {
  console.log('🔍 [competitions] Route matched for /:id, params:', req.params)
  console.log('🔍 [competitions] Request URL:', req.url)
  console.log('🔍 [competitions] Request path:', req.path)
  console.log('🔍 [competitions] Request originalUrl:', req.originalUrl)
  // Call the controller
  return competitionController.getCompetition(req, res, next)
})
router.post('/:id/submit', authenticateToken, submitAnswerValidation, validateRequest, competitionController.submitAnswer)
router.get('/:id/results', authenticateToken, competitionController.getResults)
router.get('/leaderboard/:courseId', authenticateToken, competitionController.getLeaderboard)
router.post('/:id/next-turn', authenticateToken, competitionController.nextTurn)
// Get competition progress - no auth required for viewing
router.get('/:id/progress', competitionController.getProgress)
router.post('/:id/finalize', authenticateToken, competitionController.finalizeCompetition)
router.post('/:id/score', authenticateToken, competitionController.storeFinalScore)
router.get('/:id/outcome/:learnerId', authenticateToken, competitionController.getOutcome)

// New routes for updated schema
router.post('/', async (req, res) => {
  try {
    const competitionData = req.body
    
    // Validate required fields
    if (!competitionData.course_id || !competitionData.learner1_id || !competitionData.learner2_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: course_id, learner1_id, learner2_id' 
      })
    }
    
    const competition = await CompetitionModel.create(competitionData)
    res.status(201).json(competition)
  } catch (error) {
    console.error('Error creating competition:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:competitionId/result', authenticateToken, updateResultValidation, validateRequest, async (req, res) => {
  try {
    const { competitionId } = req.params
    const { result } = req.body
    
    const updatedCompetition = await CompetitionModel.updateResult(competitionId, result)
    res.json(updatedCompetition)
  } catch (error) {
    console.error('Error updating competition result:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:competitionId', async (req, res) => {
  res.status(405).json({
    success: false,
    error: 'Competition deletion is disabled to preserve historical analytics data.'
  })
})

export default router

