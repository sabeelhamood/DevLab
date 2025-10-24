import express from 'express'
import { geminiService } from '../services/gemini.js'

const router = express.Router()

// Generate question based on course, topic, and skills
router.post('/generate-question', async (req, res) => {
  try {
    const { 
      courseName, 
      topicName, 
      nanoSkills = [], 
      macroSkills = [], 
      difficulty = 'beginner',
      language = 'javascript',
      questionType = 'coding'
    } = req.body

    if (!courseName || !topicName) {
      return res.status(400).json({
        error: 'Course name and topic name are required'
      })
    }

    let question
    if (questionType === 'coding') {
      question = await geminiService.generateCodingQuestion(
        topicName,
        difficulty,
        language,
        nanoSkills,
        macroSkills
      )
    } else {
      question = await geminiService.generateTheoreticalQuestion(
        topicName,
        difficulty,
        nanoSkills,
        macroSkills
      )
    }

    // Add course and topic context to the question
    question.courseName = courseName
    question.topicName = topicName
    question.nanoSkills = nanoSkills
    question.macroSkills = macroSkills
    question.difficulty = difficulty
    question.language = language
    question.questionType = questionType

    res.json({
      success: true,
      question,
      metadata: {
        courseName,
        topicName,
        nanoSkills,
        macroSkills,
        difficulty,
        language,
        questionType,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating question:', error)
    res.status(500).json({
      error: 'Failed to generate question',
      message: error.message
    })
  }
})

// Generate hint for a specific question
router.post('/generate-hint', async (req, res) => {
  try {
    const { 
      question, 
      userAttempt = '', 
      hintsUsed = 0, 
      allHints = [],
      courseName,
      topicName
    } = req.body

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      })
    }

    const hint = await geminiService.generateHints(
      question,
      userAttempt,
      hintsUsed,
      allHints
    )

    res.json({
      success: true,
      hint,
      metadata: {
        courseName,
        topicName,
        hintsUsed: hintsUsed + 1,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error generating hint:', error)
    res.status(500).json({
      error: 'Failed to generate hint',
      message: error.message
    })
  }
})

// Check solution and provide feedback
router.post('/check-solution', async (req, res) => {
  try {
    const { 
      question, 
      userSolution, 
      language = 'javascript',
      courseName,
      topicName
    } = req.body

    if (!question || !userSolution) {
      return res.status(400).json({
        error: 'Question and user solution are required'
      })
    }

    // First detect if solution is AI-generated
    const cheatingDetection = await geminiService.detectCheating(
      userSolution,
      question.description || question.title,
      language
    )

    // If AI-generated, return early with detection message
    if (cheatingDetection.isAiGenerated) {
      return res.json({
        success: true,
        evaluation: {
          score: 0,
          feedback: "AI-generated solution detected. Please try to solve it yourself.",
          isAiGenerated: true,
          suggestions: []
        },
        feedback: {
          message: "AI-generated solution detected. Please try to solve it yourself.",
          suggestions: ["Try to understand the problem step by step", "Write your own code from scratch", "Ask for hints if you're stuck"]
        },
        metadata: {
          courseName,
          topicName,
          language,
          checkedAt: new Date().toISOString(),
          aiDetection: cheatingDetection
        }
      })
    }

    // Evaluate the code solution (only if not AI-generated)
    const evaluation = await geminiService.evaluateCodeSubmission(
      userSolution,
      question,
      language
    )

    // Generate detailed feedback
    const feedback = await geminiService.generateLearningRecommendations(
      {
        courseName,
        topicName,
        difficulty: question.difficulty || 'beginner'
      },
      {
        solution: userSolution,
        evaluation
      }
    )

    res.json({
      success: true,
      evaluation,
      feedback,
      metadata: {
        courseName,
        topicName,
        language,
        checkedAt: new Date().toISOString(),
        aiDetection: cheatingDetection
      }
    })

  } catch (error) {
    console.error('Error checking solution:', error)
    res.status(500).json({
      error: 'Failed to check solution',
      message: error.message
    })
  }
})

// Generate complete question package (question + hints + solution)
router.post('/generate-question-package', async (req, res) => {
  console.log('🚀 Backend: Received generate-question-package request')
  console.log('📋 Backend: Request body:', req.body)
  
  try {
    const { 
      courseName, 
      topicName, 
      nanoSkills = [], 
      macroSkills = [], 
      difficulty = 'beginner',
      language = 'javascript',
      questionType = 'coding',
      questionCount = 1
    } = req.body

    if (!courseName || !topicName) {
      console.log('❌ Backend: Missing required fields')
      return res.status(400).json({
        error: 'Course name and topic name are required'
      })
    }

    // Generate questions (single or multiple)
    console.log(`🤖 Backend: Generating ${questionCount} question(s) with Gemini...`)
    let questions = []
    
    for (let i = 0; i < questionCount; i++) {
      console.log(`📝 Backend: Generating question ${i + 1} of ${questionCount}`)
      let question
      if (questionType === 'coding') {
        console.log('💻 Backend: Generating coding question')
        question = await geminiService.generateCodingQuestion(
          topicName,
          difficulty,
          language,
          nanoSkills,
          macroSkills
        )
      } else {
        console.log('📚 Backend: Generating theoretical question')
        question = await geminiService.generateTheoreticalQuestion(
          topicName,
          difficulty,
          nanoSkills,
          macroSkills
        )
      }
      
      questions.push(question)
      console.log(`✅ Backend: Generated question ${i + 1}:`, question.title || question.description?.substring(0, 50) + '...')
    }
    
    console.log(`✅ Backend: Generated ${questions.length} questions total`)

    // Process each question to add metadata and structure
    const processedQuestions = []
    
    for (const question of questions) {
      // Don't generate hints upfront - generate on-demand for better performance
      const hints = [] // Empty array - hints will be generated when requested

      // Generate solution explanation
      let solution = null
      try {
        if (questionType === 'coding' && question.solution) {
          solution = {
            code: question.solution,
            explanation: await geminiService.generateLearningRecommendations(
              { courseName, topicName, difficulty },
              { solution: question.solution }
            )
          }
        }
      } catch (error) {
        console.warn('Failed to generate solution explanation:', error.message)
      }

      // Add metadata to question
      question.courseName = courseName
      question.topicName = topicName
      question.nanoSkills = nanoSkills
      question.macroSkills = macroSkills
      question.difficulty = difficulty
      question.language = language
      question.questionType = questionType
      question.hints = hints
      question.solution = solution

      processedQuestions.push(question)
    }

    const responseData = {
      success: true,
      questions: processedQuestions,
      question: processedQuestions[0], // Keep backward compatibility
      metadata: {
        courseName,
        topicName,
        nanoSkills,
        macroSkills,
        difficulty,
        language,
        questionType,
        questionCount: processedQuestions.length,
        generatedAt: new Date().toISOString()
      }
    }
    
    console.log('📤 Backend: Sending response:', responseData)
    res.json(responseData)

  } catch (error) {
    console.error('❌ Backend: Error generating question package:', error)
    res.status(500).json({
      error: 'Failed to generate question package',
      message: error.message
    })
  }
})

// Reveal solution (only after 3 hints used)
router.post('/reveal-solution', async (req, res) => {
  try {
    const { 
      question, 
      hintsUsed,
      courseName,
      topicName,
      language = 'javascript'
    } = req.body

    if (!question) {
      return res.status(400).json({
        error: 'Question is required'
      })
    }

    if (hintsUsed < 3) {
      return res.status(400).json({
        error: 'Must use at least 3 hints before revealing solution'
      })
    }

    // Generate solution explanation
    let solution = null
    if (question.solution) {
      solution = {
        code: question.solution,
        explanation: await geminiService.generateLearningRecommendations(
          {
            courseName,
            topicName,
            difficulty: question.difficulty || 'beginner'
          },
          { solution: question.solution }
        )
      }
    } else {
      // Generate solution if not provided
      const generatedSolution = await geminiService.generateCodingQuestion(
        question.topicName || 'Programming',
        question.difficulty || 'beginner',
        language,
        question.nanoSkills || [],
        question.macroSkills || []
      )
      
      solution = {
        code: generatedSolution.solution,
        explanation: generatedSolution.explanation
      }
    }

    res.json({
      success: true,
      solution,
      metadata: {
        courseName,
        topicName,
        language,
        revealedAt: new Date().toISOString(),
        hintsUsed
      }
    })

  } catch (error) {
    console.error('Error revealing solution:', error)
    res.status(500).json({
      error: 'Failed to reveal solution',
      message: error.message
    })
  }
})

export default router
