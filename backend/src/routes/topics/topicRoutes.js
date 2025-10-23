import express from 'express'
import { TopicModel } from '../../models/Topic.js'

const router = express.Router()

// Get topic by ID
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const topic = await TopicModel.findById(topicId)
    
    if (!topic) {
      return res.status(404).json({ error: 'Topic not found' })
    }
    
    res.json(topic)
  } catch (error) {
    console.error('Error fetching topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new topic
router.post('/', async (req, res) => {
  try {
    const topicData = req.body
    
    // Validate required fields
    if (!topicData.course_id || !topicData.topic_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: course_id, topic_name' 
      })
    }
    
    const topic = await TopicModel.create(topicData)
    res.status(201).json(topic)
  } catch (error) {
    console.error('Error creating topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update topic
router.put('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const updateData = req.body
    
    const updatedTopic = await TopicModel.update(topicId, updateData)
    res.json(updatedTopic)
  } catch (error) {
    console.error('Error updating topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete topic
router.delete('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    
    await TopicModel.delete(topicId)
    res.json({ message: 'Topic deleted successfully' })
  } catch (error) {
    console.error('Error deleting topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get topics by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const topics = await TopicModel.findByCourse(courseId)
    
    res.json(topics)
  } catch (error) {
    console.error('Error fetching topics by course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get topics with specific nano skills
router.get('/nano-skills/:nanoSkills', async (req, res) => {
  try {
    const { nanoSkills } = req.params
    const skillsArray = nanoSkills.split(',')
    const topics = await TopicModel.findByNanoSkills(skillsArray)
    
    res.json(topics)
  } catch (error) {
    console.error('Error fetching topics by nano skills:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get topics with specific macro skills
router.get('/macro-skills/:macroSkills', async (req, res) => {
  try {
    const { macroSkills } = req.params
    const skillsArray = macroSkills.split(',')
    const topics = await TopicModel.findByMacroSkills(skillsArray)
    
    res.json(topics)
  } catch (error) {
    console.error('Error fetching topics by macro skills:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update nano skills for a topic
router.put('/:topicId/nano-skills', async (req, res) => {
  try {
    const { topicId } = req.params
    const { nano_skills } = req.body
    
    if (!nano_skills || !Array.isArray(nano_skills)) {
      return res.status(400).json({ error: 'Nano skills must be an array' })
    }
    
    const updatedTopic = await TopicModel.updateNanoSkills(topicId, nano_skills)
    res.json(updatedTopic)
  } catch (error) {
    console.error('Error updating nano skills:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update macro skills for a topic
router.put('/:topicId/macro-skills', async (req, res) => {
  try {
    const { topicId } = req.params
    const { macro_skills } = req.body
    
    if (!macro_skills || !Array.isArray(macro_skills)) {
      return res.status(400).json({ error: 'Macro skills must be an array' })
    }
    
    const updatedTopic = await TopicModel.updateMacroSkills(topicId, macro_skills)
    res.json(updatedTopic)
  } catch (error) {
    console.error('Error updating macro skills:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get topic statistics
router.get('/:topicId/stats', async (req, res) => {
  try {
    const { topicId } = req.params
    const stats = await TopicModel.getTopicStats(topicId)
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching topic stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all topics with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, course_id } = req.query
    const filters = { course_id }
    
    const result = await TopicModel.findAll(parseInt(page), parseInt(limit), filters)
    res.json(result)
  } catch (error) {
    console.error('Error fetching topics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

