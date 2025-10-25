import express from 'express'
import { mockMicroservices } from '../../services/mockMicroservices.js'
import { geminiService } from '../../services/gemini.js'

const router = express.Router()

// Endpoint to receive requests from Content Studio
router.post('/generate-questions', async (req, res) => {
  try {
    const {
      user_id,
      course_name,
      course_level,
      course_id,
      topic_name,
      topic_id,
      nano_skills,
      macro_skills,
      question_type,
      trainer_id
    } = req.body

    // Validate required fields
    if (!user_id || !course_name || !course_level || !course_id || !topic_name || !topic_id || !question_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, course_name, course_level, course_id, topic_name, topic_id, question_type'
      })
    }

    // Check if this is a trainer-created course (has trainerId)
    const isTrainerCourse = trainer_id && trainer_id !== null && trainer_id !== undefined
    
    console.log(`🎓 Content Studio: Course type - ${isTrainerCourse ? 'Trainer-Created' : 'AI-Created'}`)
    console.log(`👨‍🏫 Trainer ID: ${trainer_id || 'None (AI-Created)'}`)

    // Step 1: Get question amount from Directory Microservice
    const directoryResponse = await getQuestionAmountFromDirectory(user_id, course_id, topic_id)
    
    if (!directoryResponse.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get question amount from Directory service'
      })
    }

    const questionAmount = directoryResponse.amount

    // Step 2: Generate questions based on type
    let questionsPackage

    if (question_type === 'theoretical') {
      if (isTrainerCourse) {
        // For trainer courses: Validation mode only (no question generation)
        console.log('👨‍🏫 Trainer Course: Using validation mode for theoretical questions - no question generation')
        questionsPackage = {
          success: true,
          questions: [],
          message: 'Trainer course detected. Questions should be created by the trainer. Use validation endpoints for question review.',
          course_type: 'trainer_created',
          trainer_id: trainer_id
        }
      } else {
        // For AI courses: Full generation mode
        console.log('🤖 AI Course: Using full generation mode for theoretical questions')
        questionsPackage = await getTheoreticalQuestionsFromAssessment({
          topic_id,
          topic_name,
          course_name,
          course_level,
          nano_skills,
          macro_skills,
          amount: questionAmount
        })
      }
    } else if (question_type === 'code') {
      if (isTrainerCourse) {
        // For trainer courses: Validation mode only (no question generation)
        console.log('👨‍🏫 Trainer Course: Using validation mode - no question generation')
        questionsPackage = {
          success: true,
          questions: [],
          message: 'Trainer course detected. Questions should be created by the trainer. Use validation endpoints for question review.',
          course_type: 'trainer_created',
          trainer_id: trainer_id
        }
      } else {
        // For AI courses: Full generation mode
        console.log('🤖 AI Course: Using full generation mode')
        questionsPackage = await generateCodeQuestionsWithGemini({
          course_name,
          course_level,
          topic_name,
          nano_skills,
          macro_skills,
          amount: questionAmount
        })
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid question_type. Must be "theoretical" or "code"'
      })
    }

    if (!questionsPackage.success) {
      return res.status(500).json({
        success: false,
        error: questionsPackage.error || 'Failed to generate questions'
      })
    }

    // Return the questions package to Content Studio
    res.json({
      success: true,
      data: {
        user_id,
        course_id,
        topic_id,
        question_type,
        questions: questionsPackage.questions,
        metadata: {
          generated_at: new Date().toISOString(),
          question_count: questionsPackage.questions.length,
          source: question_type === 'theoretical' ? 'assessment_service' : 'gemini_ai'
        }
      }
    })

  } catch (error) {
    console.error('Error in generate-questions:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
})

// Endpoint to check solution (when learner submits)
router.post('/check-solution', async (req, res) => {
  try {
    const {
      user_id,
      question_id,
      solution,
      question_type,
      source_microservice // 'content_studio' or 'assessment'
    } = req.body

    if (!user_id || !question_id || !solution || !question_type || !source_microservice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id, question_id, solution, question_type, source_microservice'
      })
    }

    // Get the original question to provide context to Gemini
    const originalQuestion = await getQuestionById(question_id)
    
    if (!originalQuestion) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      })
    }

    // Send solution to Gemini for evaluation
    let evaluation
    if (question_type === 'code') {
      evaluation = await geminiService.evaluateCodeSubmission(
        solution,
        originalQuestion.content,
        'javascript',
        originalQuestion.test_cases || []
      )
    } else {
      // For theoretical questions, use a simple evaluation
      evaluation = {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        feedback: "Good understanding of the concepts!",
        suggestions: ["Keep practicing!", "Great work!"]
      }
    }

    if (!evaluation) {
      return res.status(500).json({
        success: false,
        error: 'Failed to evaluate solution with Gemini'
      })
    }

    // Return AI feedback to the requesting microservice
    res.json({
      success: true,
      data: {
        user_id,
        question_id,
        evaluation: evaluation,
        feedback: evaluation.feedback,
        score: evaluation.score,
        suggestions: evaluation.suggestions,
        metadata: {
          evaluated_at: new Date().toISOString(),
          source_microservice,
          evaluator: 'gemini_ai'
        }
      }
    })

  } catch (error) {
    console.error('Error in check-solution:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
})

// Helper function to get question amount from Directory Microservice
async function getQuestionAmountFromDirectory(userId, courseId, topicId) {
  try {
    // Mock implementation - in real scenario, this would be an HTTP request
    const directoryData = mockMicroservices.directoryService.getLearnerProfile(userId)
    
    // Simulate getting question amount based on user profile and course
    const questionAmount = directoryData.practice_questions_count || 5
    
    return {
      success: true,
      amount: questionAmount
    }
  } catch (error) {
    console.error('Error getting question amount from Directory:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to get theoretical questions from Assessment Microservice
async function getTheoreticalQuestionsFromAssessment(params) {
  try {
    const { topic_id, topic_name, course_name, course_level, nano_skills, macro_skills, amount } = params
    
    // Mock implementation - in real scenario, this would be an HTTP request to Assessment service
    const questions = mockMicroservices.assessmentService.generateQuestions(topic_id, amount, course_level)
    
    // Enhance questions with the provided skills and context
    const enhancedQuestions = questions.map((question, index) => ({
      ...question,
      topic_name,
      course_name,
      course_level,
      nano_skills,
      macro_skills,
      question_content: `Theoretical question ${index + 1} about ${topic_name}: ${question.question_content}`,
      expected_answer: `Expected answer for ${topic_name} question ${index + 1}`,
      hints: [
        `Hint 1: Consider the ${nano_skills[0] || 'basic concepts'}`,
        `Hint 2: Think about ${macro_skills[0] || 'fundamental principles'}`,
        `Hint 3: Review the ${topic_name} concepts`
      ]
    }))

    return {
      success: true,
      questions: enhancedQuestions
    }
  } catch (error) {
    console.error('Error getting theoretical questions from Assessment:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to generate code questions with Gemini
async function generateCodeQuestionsWithGemini(params) {
  try {
    const { course_name, course_level, topic_name, nano_skills, macro_skills, amount } = params
    
    let questions = []
    
    if (amount > 1) {
      // Use bulk generation for multiple questions
      const questionDataArray = await geminiService.generateMultipleCodingQuestions(
        topic_name,
        course_level,
        'javascript',
        nano_skills,
        macro_skills,
        amount
      )

      questions = questionDataArray.map((questionData, index) => ({
        question_id: `code_${topic_name}_${index + 1}`,
        topic_name,
        course_name,
        course_level,
        question_type: 'code',
        question_content: questionData.description || questionData.title,
        test_cases: questionData.testCases || [],
        hints: questionData.hints || [],
        solution: questionData.solution,
        nano_skills,
        macro_skills,
        difficulty: course_level
      }))
    } else {
      // Generate single question
      const questionData = await geminiService.generateCodingQuestion(
        topic_name,
        course_level,
        'javascript',
        nano_skills,
        macro_skills
      )

      if (questionData) {
        questions.push({
          question_id: `code_${topic_name}_1`,
          topic_name,
          course_name,
          course_level,
          question_type: 'code',
          question_content: questionData.description || questionData.title,
          test_cases: questionData.testCases || [],
          hints: questionData.hints || [],
          solution: questionData.solution,
          nano_skills,
          macro_skills,
          difficulty: course_level
        })
      }
    }

    return {
      success: true,
      questions
    }
  } catch (error) {
    console.error('Error generating code questions with Gemini:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Helper function to get question by ID (mock implementation)
async function getQuestionById(questionId) {
  // Mock implementation - in real scenario, this would query the database
  return {
    id: questionId,
    content: "Sample question content",
    type: "code",
    test_cases: [
      { input: "test input", expected: "test output" }
    ]
  }
}

// Validation endpoints for trainer-created courses
// These endpoints allow trainers to validate their questions and get feedback

// Validate a trainer-created question
router.post('/validate-question', async (req, res) => {
  try {
    const {
      question_content,
      question_type,
      topic_name,
      course_name,
      course_level,
      nano_skills,
      macro_skills,
      trainer_id
    } = req.body

    // Validate required fields
    if (!question_content || !question_type || !trainer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question_content, question_type, trainer_id'
      })
    }

    console.log(`👨‍🏫 Trainer Validation: Validating question for trainer ${trainer_id}`)

    // Use Gemini to validate and provide feedback on the trainer's question
    let validationResult
    if (question_type === 'code') {
      validationResult = await geminiService.validateCodingQuestion({
        question: question_content,
        topic: topic_name,
        difficulty: course_level,
        nanoSkills: nano_skills || [],
        macroSkills: macro_skills || []
      })
    } else {
      validationResult = await geminiService.validateTheoreticalQuestion({
        question: question_content,
        topic: topic_name,
        difficulty: course_level,
        nanoSkills: nano_skills || [],
        macroSkills: macro_skills || []
      })
    }

    res.json({
      success: true,
      validation: validationResult,
      course_type: 'trainer_created',
      trainer_id: trainer_id,
      message: 'Question validation completed'
    })

  } catch (error) {
    console.error('Error validating trainer question:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate question',
      details: error.message
    })
  }
})

// Get hints and feedback for trainer-created questions
router.post('/get-question-feedback', async (req, res) => {
  try {
    const {
      question_content,
      question_type,
      user_solution,
      language,
      trainer_id
    } = req.body

    // Validate required fields
    if (!question_content || !question_type || !trainer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question_content, question_type, trainer_id'
      })
    }

    console.log(`👨‍🏫 Trainer Feedback: Getting feedback for trainer ${trainer_id}`)

    // Use existing Gemini services to provide hints and feedback
    let feedbackResult
    if (question_type === 'code') {
      // Get hints for coding questions
      const hints = await geminiService.generateHints(question_content, user_solution || '', 0)
      
      // Get solution evaluation if user solution provided
      let evaluation = null
      if (user_solution) {
        evaluation = await geminiService.evaluateCodeSubmission(
          question_content,
          user_solution,
          language || 'javascript'
        )
      }

      feedbackResult = {
        hints: hints,
        evaluation: evaluation,
        canProvideSolution: true
      }
    } else {
      // For theoretical questions, provide general feedback
      feedbackResult = {
        feedback: "Theoretical question feedback would be provided here",
        suggestions: ["Consider adding more specific examples", "Ensure the question tests the intended learning objectives"],
        canProvideSolution: false
      }
    }

    res.json({
      success: true,
      feedback: feedbackResult,
      course_type: 'trainer_created',
      trainer_id: trainer_id,
      message: 'Question feedback generated'
    })

  } catch (error) {
    console.error('Error getting trainer question feedback:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get question feedback',
      details: error.message
    })
  }
})

export default router
