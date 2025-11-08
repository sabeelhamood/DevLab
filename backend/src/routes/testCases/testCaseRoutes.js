import express from 'express'
import { TestCaseModel } from '../../models/TestCase.js'

const router = express.Router()

// Get test case by ID
router.get('/:testCaseId', async (req, res) => {
  try {
    const { testCaseId } = req.params
    const testCase = await TestCaseModel.findById(testCaseId)
    
    if (!testCase) {
      return res.status(404).json({ error: 'Test case not found' })
    }
    
    res.json(testCase)
  } catch (error) {
    console.error('Error fetching test case:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create new test case
router.post('/', async (req, res) => {
  try {
    const testCaseData = req.body
    
    // Validate required fields
    if (!testCaseData.question_id || !testCaseData.input || !testCaseData.expected_output) {
      return res.status(400).json({ 
        error: 'Missing required fields: question_id, input, expected_output' 
      })
    }
    
    const testCase = await TestCaseModel.create(testCaseData)
    res.status(201).json(testCase)
  } catch (error) {
    console.error('Error creating test case:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create multiple test cases for a question
router.post('/bulk', async (req, res) => {
  try {
    const { question_id, testCases } = req.body
    
    if (!question_id || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({ 
        error: 'Missing required fields: question_id, testCases (array)' 
      })
    }
    
    const createdTestCases = await TestCaseModel.createMultiple(question_id, testCases)
    res.status(201).json(createdTestCases)
  } catch (error) {
    console.error('Error creating multiple test cases:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update test case
router.put('/:testCaseId', async (req, res) => {
  try {
    const { testCaseId } = req.params
    const updateData = req.body
    
    const updatedTestCase = await TestCaseModel.update(testCaseId, updateData)
    res.json(updatedTestCase)
  } catch (error) {
    console.error('Error updating test case:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete test case
router.delete('/:testCaseId', async (req, res) => {
  try {
    const { testCaseId } = req.params
    
    await TestCaseModel.delete(testCaseId)
    res.json({ message: 'Test case deleted successfully' })
  } catch (error) {
    console.error('Error deleting test case:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete all test cases for a question
router.delete('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params
    
    await TestCaseModel.deleteByQuestion(questionId)
    res.json({ message: 'All test cases for question deleted successfully' })
  } catch (error) {
    console.error('Error deleting test cases by question:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get test cases by question
router.get('/question/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params
    const testCases = await TestCaseModel.findByQuestion(questionId)
    
    res.json(testCases)
  } catch (error) {
    console.error('Error fetching test cases by question:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get test cases by course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params
    const testCases = await TestCaseModel.findByCourse(courseId)
    
    res.json(testCases)
  } catch (error) {
    console.error('Error fetching test cases by course:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get test cases by topic
router.get('/topic/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params
    const testCases = await TestCaseModel.findByTopic(topicId)
    
    res.json(testCases)
  } catch (error) {
    console.error('Error fetching test cases by topic:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get test cases for code execution
router.get('/execution/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params
    const testCases = await TestCaseModel.getForExecution(questionId)
    
    res.json(testCases)
  } catch (error) {
    console.error('Error fetching test cases for execution:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Validate test case input/output
router.post('/:testCaseId/validate', async (req, res) => {
  try {
    const { testCaseId } = req.params
    const { actualOutput } = req.body
    
    if (actualOutput === undefined) {
      return res.status(400).json({ error: 'actualOutput is required' })
    }
    
    const validation = await TestCaseModel.validateTestCase(testCaseId, actualOutput)
    res.json(validation)
  } catch (error) {
    console.error('Error validating test case:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get test case statistics for a question
router.get('/stats/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params
    const stats = await TestCaseModel.getQuestionStats(questionId)
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching test case stats:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all test cases with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const result = await TestCaseModel.findAll(parseInt(page), parseInt(limit))
    
    res.json(result)
  } catch (error) {
    console.error('Error fetching test cases:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

