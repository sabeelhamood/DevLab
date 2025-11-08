import express from 'express'
import { CourseModel } from '../../models/Course.js'

const router = express.Router()

// Get course by ID
router.get('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const course = await CourseModel.findById(courseId)
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
    
    res.json(course)
  } catch (error) {
    console.error('Error fetching course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new course
router.post('/', async (req, res) => {
  try {
    const courseData = req.body
    
    // Validate required fields
    if (!courseData.trainer_id || !courseData.level) {
      return res.status(400).json({ 
        error: 'Missing required fields: trainer_id, level' 
      })
    }
    
    const course = await CourseModel.create(courseData)
    res.status(201).json(course)
  } catch (error) {
    console.error('Error creating course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update course
router.put('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const updateData = req.body
    
    const updatedCourse = await CourseModel.update(courseId, updateData)
    res.json(updatedCourse)
  } catch (error) {
    console.error('Error updating course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete course
router.delete('/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    
    await CourseModel.delete(courseId)
    res.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get courses by trainer
router.get('/trainer/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params
    const courses = await CourseModel.findByTrainer(trainerId)
    
    res.json(courses)
  } catch (error) {
    console.error('Error fetching courses by trainer:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get courses by level
router.get('/level/:level', async (req, res) => {
  try {
    const { level } = req.params
    const courses = await CourseModel.findByLevel(level)
    
    res.json(courses)
  } catch (error) {
    console.error('Error fetching courses by level:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update AI feedback for course
router.put('/:courseId/ai-feedback', async (req, res) => {
  try {
    const { courseId } = req.params
    const { ai_feedback } = req.body
    
    if (!ai_feedback) {
      return res.status(400).json({ error: 'AI feedback is required' })
    }
    
    const updatedCourse = await CourseModel.updateAIFeedback(courseId, ai_feedback)
    res.json(updatedCourse)
  } catch (error) {
    console.error('Error updating AI feedback:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all courses with pagination and filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, level, trainer_id } = req.query
    const filters = { level, trainer_id }
    
    const result = await CourseModel.findAll(parseInt(page), parseInt(limit), filters)
    res.json(result)
  } catch (error) {
    console.error('Error fetching courses:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

