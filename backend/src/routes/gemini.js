import express from 'express'
import { geminiService } from '../services/gemini.js'
import { fetchAssessmentTheoreticalQuestions } from '../services/assessmentClient.js'

const router = express.Router()

// Generate question (unified endpoint)
router.post('/generate-question', async (req, res) => {
  try {
    const {
      topic,
      type = 'code',
      language = 'javascript',
      skills = [],
      amount = 1,
      humanLanguage = 'en',
      topic_id = null,
      difficulty = 'intermediate'
    } = req.body

    if (!topic) {
      return res.status(400).json({
        error: 'Topic is required'
      })
    }

    const normalizedAmount = Math.max(1, parseInt(amount, 10) || 1)
    const normalizedSkills = Array.isArray(skills) ? skills.filter(Boolean) : []

    let question
    let source = 'gemini'

    if (type === 'code') {
      const generated = await geminiService.generateCodingQuestion(
        topic,
        normalizedSkills,
        normalizedAmount,
        language || 'javascript',
        {
          humanLanguage,
          topic_id
        }
      )
      const generatedArray = Array.isArray(generated) ? generated : generated ? [generated] : []
      question = normalizedAmount === 1 ? generatedArray[0] || null : generatedArray
    } else if (type === 'theoretical') {
      source = 'assessment'
      const theoretical = await fetchAssessmentTheoreticalQuestions({
        topic_id: topic_id || null,
        topic_name: topic,
        amount: normalizedAmount,
        difficulty,
        humanLanguage,
        skills: normalizedSkills
      })
      question = normalizedAmount === 1 ? theoretical?.[0] : theoretical
    } else {
      return res.status(400).json({
        error: 'Invalid question type'
      })
    }

    // Clean question object(s) - remove deprecated fields
    const cleanQuestion = (q) => {
      if (!q) return q
      const cleaned = Array.isArray(q) ? q.map(cleanQuestion) : { ...q }
      if (!Array.isArray(cleaned)) {
        delete cleaned.courseName // Remove courseName - no longer used
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
      }
      return cleaned
    }
    
    const cleanedQuestion = cleanQuestion(question)

    res.json({
      success: true,
      question: cleanedQuestion,
      source,
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