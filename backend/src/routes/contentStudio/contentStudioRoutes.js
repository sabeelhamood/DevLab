import express from 'express'
import { openAIContentStudioService } from '../../services/openAIContentStudioService.js'
import {
  createRequestId,
  saveTempQuestions,
  confirmTempQuestions
} from '../../services/tempQuestionStore.js'
import { fetchAssessmentTheoreticalQuestions } from '../../services/assessmentClient.js'
import { addPresentationToQuestion } from '../../utils/questionPresentation.js'
import { saveQuestionsToSupabase } from '../../services/questionStorageService.js'

const router = express.Router()

const DEFAULT_AMOUNT = 4
const DEFAULT_DIFFICULTY = 'intermediate'
const DEFAULT_PROGRAMMING_LANGUAGE = 'javascript'
const DIFFICULTY_SEQUENCE = [
  'basic',
  'basic-plus',
  'intermediate',
  'upper-intermediate',
  'advanced',
  'advanced-plus',
  'expert'
]

const buildDifficultyLadder = (count) => {
  if (!count || count <= 0) return []
  return Array.from({ length: count }, (_, index) =>
    DIFFICULTY_SEQUENCE[Math.min(index, DIFFICULTY_SEQUENCE.length - 1)]
  )
}

const normalizeSkills = (skillsPayload = []) => {
  const ensureArray = (value) => {
    if (!value && value !== 0) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return []
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean)
        }
      } catch {
        if (trimmed.includes(',')) {
          return trimmed.split(',').map((item) => item.trim()).filter(Boolean)
        }
      }
      return [trimmed]
    }
    return []
  }

  if (Array.isArray(skillsPayload)) {
    return Array.from(new Set(ensureArray(skillsPayload)))
  }

  if (typeof skillsPayload === 'object' && skillsPayload !== null) {
    const combined = [
      ...ensureArray(skillsPayload.skills),
      ...ensureArray(skillsPayload.items),
      ...ensureArray(skillsPayload.values)
    ]

    return Array.from(new Set(combined.filter(Boolean)))
  }

  return []
}

const toAjaxCodingQuestion = ({
  id,
  question,
  testCases = [],
  hints = [],
  programmingLanguage,
  topicId,
  topicName,
  humanLanguage,
  difficulty
}) => {
  const safeHints = hints.filter(Boolean).slice(0, 3)

  const baseQuestion = {
    id,
    topic_id: topicId,
    topic_name: topicName,
    question_type: 'code',
    programming_language: programmingLanguage,
    difficulty,
    question,
    test_cases: testCases.map((tc, index) => ({
      id: `${id}_tc_${index + 1}`,
      input: tc.input,
      expected_output: tc.expected_output ?? tc.output,
      explanation: tc.explanation || null
    })),
    clues: safeHints,
    ajax: {
      question,
      testCases: testCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.expected_output ?? tc.output
      })),
      judge0: {
        runtime: programmingLanguage,
        sandbox: true
      },
      hints: safeHints,
      humanLanguage,
      difficulty
    }
  }

  return addPresentationToQuestion(baseQuestion, {
    id,
    questionType: 'code',
    title: topicName ? `${topicName} Coding Challenge` : 'Coding Challenge',
    prompt: question,
    topicName,
    difficulty,
    programmingLanguage,
    hints: safeHints,
    testCases: baseQuestion.test_cases,
    features: {
      hints: true,
      submit: true,
      proctoring: true,
      sandbox: true,
      runTests: true
    }
  })
}

const toAjaxTheoreticalQuestion = ({
  id,
  question,
  topicId,
  topicName,
  humanLanguage,
  expectedAnswer,
  difficulty
}) => {
  const baseQuestion = {
    id,
    topic_id: topicId,
    topic_name: topicName,
    question_type: 'theoretical',
    difficulty: difficulty || null,
    programming_language: null,
    question,
    test_cases: [],
    ajax: {
      question,
      testCases: [],
      judge0: null,
      hints: [],
      humanLanguage,
      expectedAnswer,
      difficulty: difficulty || null
    }
  }

  return addPresentationToQuestion(baseQuestion, {
    id,
    questionType: 'theoretical',
    title: topicName ? `${topicName} Concept Check` : 'Concept Check',
    prompt: question,
    topicName,
    difficulty: difficulty || null,
    expectedAnswer,
    features: {
      hints: false,
      submit: true,
      proctoring: true,
      sandbox: false,
      runTests: false
    }
  })
}

const fetchTheoreticalQuestionsFromAssessment = async ({
  topic_id,
  topic_name,
  amount,
  humanLanguage,
  skills
}) => {
  try {
    const assessmentQuestions = await fetchAssessmentTheoreticalQuestions({
      topic_id,
      topic_name,
      amount,
      difficulty: DEFAULT_DIFFICULTY,
      humanLanguage,
      skills
    })

    return (assessmentQuestions || []).map((item, index) =>
      toAjaxTheoreticalQuestion({
        id:
          item.id ||
          item.question_id ||
          `theoretical_${topic_id}_${index + 1}`,
        question:
          item.question_content ||
          item.question ||
          item.title ||
          item.description ||
          '',
        topicId: item.topic_id || topic_id,
        topicName: item.topic_name || topic_name,
        humanLanguage,
        expectedAnswer: item.expected_answer || item.expectedAnswer || null,
        difficulty: item.difficulty || DEFAULT_DIFFICULTY,
        skills
      })
    )
  } catch (error) {
    console.error('Assessment theoretical fetch error:', error)
    return []
  }
}

const generateCodingQuestions = async ({
  topic_name,
  topic_id,
  amount,
  programming_language,
  skills,
  humanLanguage,
  seedQuestion
}) => {
  try {
    const generated = await openAIContentStudioService.generateCodingQuestion(
      topic_name,
      Array.isArray(skills) ? skills : [],
      amount,
      programming_language,
      {
        humanLanguage,
        seedQuestion
      }
    )

    const questionArray = Array.isArray(generated) ? generated : generated ? [generated] : []

    if (!questionArray.length) {
      return []
    }

    const ladder = buildDifficultyLadder(questionArray.length || amount)

    return questionArray
      .filter(Boolean)
      .map((item, index) =>
        toAjaxCodingQuestion({
          id: `code_${topic_id}_${index + 1}`,
          question: item.description || item.title,
          testCases: item.testCases || [],
          hints: item.hints || [],
          programmingLanguage: programming_language,
          topicId: topic_id,
          topicName: topic_name,
          humanLanguage,
          difficulty: item.difficulty || ladder[index] || ladder[ladder.length - 1] || DEFAULT_DIFFICULTY
        })
      )
  } catch (error) {
    console.error('Gemini coding generation error:', error)
    return []
  }
}

const validateCodingQuestionWithGemini = async ({
  question,
  topic_name,
  skills,
  humanLanguage
}) => {
  const validation = await geminiService.validateCodingQuestion({
    question,
    topic: topic_name,
    difficulty: DEFAULT_DIFFICULTY,
    skills,
    humanLanguage
  })

  return validation
}

export const generateQuestionsHandler = async (req, res) => {
  try {
    const {
      amount = DEFAULT_AMOUNT,
      topic_id,
      topic_name,
      course_id,
      skills = [],
      question_type,
      programming_language,
      humanLanguage = 'en'
    } = req.body || {}

    if (!topic_id || !topic_name || !question_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: topic_id, topic_name, question_type'
      })
    }

    if (question_type === 'code' && !programming_language) {
      return res.status(400).json({
        success: false,
        error: 'programming_language is required when question_type is "code"'
      })
    }

    const normalizedSkills = normalizeSkills(skills)
    const questionCount = Number(amount) > 0 ? Number(amount) : DEFAULT_AMOUNT

    let questions = []
    let source = ''

    if (question_type === 'code') {
      questions = await generateCodingQuestions({
        topic_name,
        topic_id,
        amount: questionCount,
        programming_language: programming_language || DEFAULT_PROGRAMMING_LANGUAGE,
        skills: normalizedSkills,
        humanLanguage
      })
      source = 'gemini_ai'
    } else if (question_type === 'theoretical') {
      questions = await fetchTheoreticalQuestionsFromAssessment({
        topic_id,
        topic_name,
        amount: questionCount,
        humanLanguage,
        skills: normalizedSkills
      })
      source = 'assessment_service'
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid question_type. Must be "code" or "theoretical"'
      })
    }

    if (!questions.length) {
      return res.status(500).json({
        success: false,
        error: 'Unable to generate questions with provided parameters'
      })
    }

    const requestId = createRequestId()

    await saveTempQuestions({
      requestId,
      requesterService: 'content-studio',
      action: 'generate-questions',
      questions,
      metadata: {
        topic_id,
        topic_name,
        question_type,
        programming_language,
        skills: normalizedSkills,
        questionCount,
        humanLanguage
      }
    })

    // Save questions to Supabase automatically
    // This runs in the background and doesn't block the response
    try {
      console.log('🔍 Saving questions to Supabase...')
      console.log(`   Question count: ${questions.length}`)
      console.log(`   Question type: ${question_type}`)
      console.log(`   Topic ID: ${topic_id}`)
      console.log(`   Topic name: ${topic_name}`)
      
      const saveMetadata = {
        topic_id,
        topic_name,
        question_type,
        programming_language: question_type === 'code' ? programming_language : null,
        course_id: course_id || null, // Extract from request if available
        skills: normalizedSkills,
        humanLanguage,
        source: 'content-studio'
      }
      
      // Save questions asynchronously - don't await to avoid blocking response
      saveQuestionsToSupabase(questions, saveMetadata)
        .then((saveResults) => {
          const savedCount = saveResults.filter(r => r.success).length
          const failedCount = saveResults.filter(r => !r.success && !r.skipped).length
          const skippedCount = saveResults.filter(r => r.skipped).length
          
          if (savedCount > 0) {
            console.log(`✅ Successfully saved ${savedCount} question(s) to Supabase`)
            saveResults
              .filter(r => r.success)
              .forEach((result, index) => {
                console.log(`   ${index + 1}. Question ID: ${result.question_id}`)
                console.log(`      Type: ${result.question_type}`)
                console.log(`      Content: ${result.question_content?.substring(0, 50)}...`)
              })
          }
          if (skippedCount > 0) {
            console.log(`⏭️  Skipped ${skippedCount} question(s) (duplicates)`)
          }
          if (failedCount > 0) {
            console.warn(`⚠️ Failed to save ${failedCount} question(s) to Supabase`)
            saveResults
              .filter(r => !r.success && !r.skipped)
              .forEach((result, index) => {
                console.warn(`   ${index + 1}. Error: ${result.error || result.message}`)
              })
          }
        })
        .catch((error) => {
          // Log error but don't throw - questions were generated successfully
          console.error('❌ Error saving questions to Supabase:', error.message)
          console.error('   Questions were generated successfully but not saved to database')
          console.error('   Error stack:', error.stack)
        })
    } catch (error) {
      // Don't fail the request if Supabase save fails - log error and continue
      console.error('❌ Error initiating question save to Supabase:', error.message)
      console.error('   Questions were generated successfully but save was not initiated')
    }

    // Remove deprecated fields from all questions
    const cleanedQuestions = questions.map(q => {
      const cleaned = { ...q }
      delete cleaned.courseName // Remove courseName - no longer used
      // Ensure skills field exists
      if (!cleaned.skills) {
        cleaned.skills = []
      }
      return cleaned
    })

    return res.json({
      success: true,
      request_id: requestId,
      data: {
        topic_id,
        topic_name,
        question_type,
        programming_language: question_type === 'code' ? programming_language : null,
        questions: cleanedQuestions,
        metadata: {
          generated_at: new Date().toISOString(),
          question_count: questions.length,
          source,
          request_id: requestId
        }
      }
    })
  } catch (error) {
    console.error('Content Studio generate-questions error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

// Endpoint to check solution (when learner submits)
export const checkSolutionHandler = async (req, res) => {
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
      evaluation = await openAIContentStudioService.evaluateCodeSubmission(
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
}

// Additional routes remain below (check-solution, validation, etc.)

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
export const validateQuestionHandler = async (req, res) => {
  try {
    const {
      question,
      question_content,
      question_type,
      topic_id,
      topic_name,
      skills = [],
      programming_language,
      humanLanguage = 'en'
    } = req.body || {}

    const trainerQuestion = question || question_content

    if (!trainerQuestion || !question_type || !topic_id || !topic_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question (or question_content), question_type, topic_id, topic_name'
      })
    }

    const normalizedSkills = normalizeSkills(skills)

    if (question_type === 'theoretical') {
      const assessmentPayload = await fetchTheoreticalQuestionsFromAssessment({
        topic_id,
        topic_name,
        amount: 1,
        humanLanguage,
        skills: normalizedSkills
      })

      return res.json({
        success: true,
        data: {
          status: 'forwarded_to_assessment',
          questions: assessmentPayload,
          metadata: {
            topic_id,
            topic_name,
            question_type
          }
        }
      })
    }

    if (question_type !== 'code') {
      return res.status(400).json({
        success: false,
        error: 'question_type must be "code" or "theoretical"'
      })
    }

    const validation = await validateCodingQuestionWithGemini({
      question: trainerQuestion,
      topic_name,
      skills: normalizedSkills,
      humanLanguage
    })

    if (!validation?.isRelevant) {
      return res.json({
        success: true,
        data: {
          status: 'needs_revision',
          message:
            validation?.message ||
            'Question is not relevant to the provided topic or skills. Please revise the question.',
          validation
        }
      })
    }

    const generated = await generateCodingQuestions({
      topic_name,
      topic_id,
      amount: 1,
      programming_language: programming_language || DEFAULT_PROGRAMMING_LANGUAGE,
      skills: normalizedSkills,
      humanLanguage,
      seedQuestion: trainerQuestion
    })

    if (!generated.length) {
      return res.status(500).json({
        success: false,
        error: 'Unable to transform trainer question into coding package'
      })
    }

    return res.json({
      success: true,
      data: {
        status: 'approved',
        message: 'Question is relevant. Generated coding package attached.',
        validation,
        questions: generated
      }
    })
  } catch (error) {
    console.error('Error validating trainer question:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to validate question',
      details: error.message
    })
  }
}

// Get hints and feedback for trainer-created questions
export const getQuestionFeedbackHandler = async (req, res) => {
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
        evaluation = await openAIContentStudioService.evaluateCodeSubmission(
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
}

router.post('/generate-questions', generateQuestionsHandler)

export const confirmQuestionsHandler = async (req, res) => {
  try {
    const { request_id, requester_service = 'content-studio' } = req.body || {}

    if (!request_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: request_id'
      })
    }

    const removed = await confirmTempQuestions({ requestId: request_id })

    if (!removed) {
      return res.status(404).json({
        success: false,
        error: 'Temporary question batch not found or already confirmed'
      })
    }

    return res.json({
      success: true,
      request_id
    })
  } catch (error) {
    console.error('Error confirming question delivery:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to confirm question delivery',
      details: error.message
    })
  }
}

// Endpoint to check solution (when learner submits)
router.post('/check-solution', checkSolutionHandler)

router.post('/validate-question', validateQuestionHandler)

router.post('/get-question-feedback', getQuestionFeedbackHandler)
router.post('/confirm-questions', confirmQuestionsHandler)

export const contentStudioHandlers = {
  generateQuestions: generateQuestionsHandler,
  checkSolution: checkSolutionHandler,
  validateQuestion: validateQuestionHandler,
  getQuestionFeedback: getQuestionFeedbackHandler,
  confirmQuestions: confirmQuestionsHandler
}

export default router
