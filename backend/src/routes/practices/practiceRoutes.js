import express from 'express'
import { PracticeModel } from '../../models/Practice.js'

const router = express.Router()

// Get practice by ID
router.get('/:practiceId', async (req, res) => {
  try {
    const { practiceId } = req.params
    const practice = await PracticeModel.findById(practiceId)
    
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' })
    }
    
    res.json(practice)
  } catch (error) {
    console.error('Error fetching practice:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new practice session
router.post('/', async (req, res) => {
  try {
    const practiceData = req.body
    
    // Validate required fields
    if (!practiceData.learner_id || !practiceData.course_id || !practiceData.topic_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: learner_id, course_id, topic_id' 
      })
    }
    
    const practice = await PracticeModel.create(practiceData)
    res.status(201).json(practice)
  } catch (error) {
    console.error('Error creating practice:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update practice
router.put('/:practiceId', async (req, res) => {
  try {
    const { practiceId } = req.params
    const updateData = req.body
    
    const updatedPractice = await PracticeModel.update(practiceId, updateData)
    res.json(updatedPractice)
  } catch (error) {
    console.error('Error updating practice:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update practice status
router.put('/:practiceId/status', async (req, res) => {
  try {
    const { practiceId } = req.params
    const { status } = req.body
    
    if (!status || !['in_progress', 'completed', 'abandoned'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be one of: in_progress, completed, abandoned' 
      })
    }
    
    const updatedPractice = await PracticeModel.updateStatus(practiceId, status)
    res.json(updatedPractice)
  } catch (error) {
    console.error('Error updating practice status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update practice score
router.put('/:practiceId/score', async (req, res) => {
  try {
    const { practiceId } = req.params
    const { score } = req.body
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ 
        error: 'Score must be a number between 0 and 100' 
      })
    }
    
    const updatedPractice = await PracticeModel.updateScore(practiceId, score)
    res.json(updatedPractice)
  } catch (error) {
    console.error('Error updating practice score:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update practice content
router.put('/:practiceId/content', async (req, res) => {
  try {
    const { practiceId } = req.params
    const { content } = req.body
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' })
    }
    
    const updatedPractice = await PracticeModel.updateContent(practiceId, content)
    res.json(updatedPractice)
  } catch (error) {
    console.error('Error updating practice content:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete practice
router.delete('/:practiceId', async (req, res) => {
  try {
    const { practiceId } = req.params
    
    await PracticeModel.delete(practiceId)
    res.json({ message: 'Practice deleted successfully' })
  } catch (error) {
    console.error('Error deleting practice:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get practices by learner
router.get('/learner/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    const { limit = 20 } = req.query
    const practices = await PracticeModel.findByLearner(learnerId, parseInt(limit))
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching practices by learner:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get practices by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const { limit = 20 } = req.query
    const practices = await PracticeModel.findByCourse(courseId, parseInt(limit))
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching practices by course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get practices by topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const { limit = 20 } = req.query
    const practices = await PracticeModel.findByTopic(topicId, parseInt(limit))
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching practices by topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get active practices
router.get('/active/:learnerId?', async (req, res) => {
  try {
    const { learnerId } = req.params
    const practices = await PracticeModel.getActive(learnerId)
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching active practices:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get completed practices
router.get('/completed/:learnerId?', async (req, res) => {
  try {
    const { learnerId } = req.params
    const practices = await PracticeModel.getCompleted(learnerId)
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching completed practices:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get practice statistics for a learner
router.get('/stats/learner/:learnerId', async (req, res) => {
  try {
    const { learnerId } = req.params
    const stats = await PracticeModel.getLearnerStats(learnerId)
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching learner practice stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get practice statistics for a topic
router.get('/stats/topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const stats = await PracticeModel.getTopicStats(topicId)
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching topic practice stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get recent practices
router.get('/recent/:limit?', async (req, res) => {
  try {
    const { limit = 10 } = req.params
    const practices = await PracticeModel.getRecent(parseInt(limit))
    
    res.json(practices)
  } catch (error) {
    console.error('Error fetching recent practices:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all practices with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      learner_id, 
      course_id, 
      topic_id, 
      status 
    } = req.query
    
    const filters = { learner_id, course_id, topic_id, status }
    const result = await PracticeModel.findAll(parseInt(page), parseInt(limit), filters)
    
    res.json(result)
  } catch (error) {
    console.error('Error fetching practices:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

