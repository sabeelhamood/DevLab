import express from 'express'
import { geminiService } from '../services/gemini.js'

const router = express.Router()

// Generate question (unified endpoint)
router.post('/generate-question', async (req, res) => {
  try {
    const { topic, difficulty, language, type, nanoSkills = [], macroSkills = [] } = req.body
    
    if (!topic || !difficulty) {
      return res.status(400).json({ 
        error: 'Topic and difficulty are required' 
      })
    }

    let question
    if (type === 'code') {
      question = await geminiService.generateCodingQuestion(
        topic, 
        difficulty, 
        language || 'javascript',
        nanoSkills,
        macroSkills
      )
    } else {
      question = await geminiService.generateTheoreticalQuestion(
        topic, 
        difficulty,
        nanoSkills,
        macroSkills
      )
    }
    
    res.json({
      success: true,
      question,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating question:', error)
    res.status(500).json({ 
      error: 'Failed to generate question',
      message: error.message 
    })
  }
})

// Evaluate code
router.post('/evaluate-code', async (req, res) => {
  try {
    const { code, question, language = 'javascript', testCases = [] } = req.body
    
    if (!code || !question) {
      return res.status(400).json({ 
        error: 'Code and question are required' 
      })
    }

    const evaluation = await geminiService.evaluateCodeSubmission(code, question, language, testCases)
    
    res.json({
      success: true,
      evaluation,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error evaluating code:', error)
    res.status(500).json({ 
      error: 'Failed to evaluate code',
      message: error.message 
    })
  }
})

// Generate hint
router.post('/generate-hint', async (req, res) => {
  try {
    const { question, userAttempt, hintsUsed = 0, allHints = [] } = req.body
    
    if (!question) {
      return res.status(400).json({ 
        error: 'Question is required' 
      })
    }

    const hint = await geminiService.generateHints(question, userAttempt, hintsUsed, allHints)
    
    res.json({
      success: true,
      hint,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating hint:', error)
    res.status(500).json({ 
      error: 'Failed to generate hint',
      message: error.message 
    })
  }
})

// Detect cheating
router.post('/detect-cheating', async (req, res) => {
  try {
    const { code, question } = req.body
    
    if (!code || !question) {
      return res.status(400).json({ 
        error: 'Code and question are required' 
      })
    }

    const detection = await geminiService.detectCheating(code, question)
    
    res.json({
      success: true,
      detection,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error detecting cheating:', error)
    res.status(500).json({ 
      error: 'Failed to detect cheating',
      message: error.message 
    })
  }
})

export default router