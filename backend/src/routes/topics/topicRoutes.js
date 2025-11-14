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

// Get topics with specific skills
router.get('/skills/:skills', async (req, res) => {
  try {
    const { skills } = req.params
    const skillsArray = skills.split(',').map((skill) => skill.trim()).filter(Boolean)
    const topics = await TopicModel.findBySkills(skillsArray)
    
    res.json(topics)
  } catch (error) {
    console.error('Error fetching topics by skills:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Replace skills for a topic
router.put('/:topicId/skills', async (req, res) => {
  try {
    const { topicId } = req.params
    const { skills } = req.body
    
    if (!Array.isArray(skills)) {
      return res.status(400).json({ error: 'Skills must be an array' })
    }
    
    const updatedTopic = await TopicModel.updateSkills(topicId, skills)
    res.json(updatedTopic)
  } catch (error) {
    console.error('Error updating skills:', error)
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

