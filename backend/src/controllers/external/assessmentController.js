import { geminiService } from '../../services/gemini.js'
import { openAIService } from '../../services/openAIService.js'
import {
  createRequestId,
  saveTempQuestions,
  confirmTempQuestions
} from '../../services/tempQuestionStore.js'
import { fetchAssessmentTheoreticalQuestions } from '../../services/assessmentClient.js'
import { addPresentationToQuestion } from '../../utils/questionPresentation.js'
import { renderAssessmentCodeQuestions, saveAssessmentCodeQuestions } from '../../utils/assessmentComponentRenderer.js'

const DIFFICULTY_SEQUENCE = [
  'basic',
  'basic-plus',
  'intermediate',
  'upper-intermediate',
  'advanced',
  'advanced-plus',
  'expert'
]

const DEFAULT_THEORETICAL_DIFFICULTY = 'intermediate'

const parseSkills = (value) => {
  if (!value && value !== 0) return []
  if (Array.isArray(value)) return value

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
      }
      return [trimmed]
    } catch {
      return trimmed.includes(',')
        ? trimmed.split(',').map((item) => item.trim())
        : [trimmed]
    }
  }

  return []
}

const normalizeSkills = (...sources) => {
  const combined = sources
    .flatMap((source) => parseSkills(source))
    .map((skill) => (typeof skill === 'string' ? skill.trim() : skill))
    .filter(Boolean)

  return Array.from(new Set(combined))
}

const buildDifficultyLadder = (count) => {
  if (!count || count <= 0) return []
  return Array.from({ length: count }, (_, index) =>
    DIFFICULTY_SEQUENCE[Math.min(index, DIFFICULTY_SEQUENCE.length - 1)]
  )
}

export const assessmentController = {
  async getTheoreticalQuestions(req, res) {
    try {
      const payload = {
        topic_id: req.body?.topic_id || req.query?.topic_id || req.body?.topicId || req.query?.topicId,
        topic_name:
          req.body?.topic_name ||
          req.query?.topic_name ||
          req.body?.topicName ||
          req.query?.topicName,
        amount: Number(
          req.body?.amount ??
            req.query?.amount ??
            req.body?.number_of_questions ??
            req.query?.number_of_questions ??
            1
        ),
        difficulty:
          req.body?.difficulty ||
          req.query?.difficulty ||
          DEFAULT_THEORETICAL_DIFFICULTY,
        humanLanguage:
          req.body?.humanLanguage || req.query?.humanLanguage || 'en',
        skills: normalizeSkills(
          req.body?.skills,
          req.query?.skills
        )
      }

      if (!payload.topic_id || !payload.topic_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: topic_id, topic_name'
        })
      }

      const questions = await fetchAssessmentTheoreticalQuestions(payload)

      res.json({
        success: true,
        data: {
          topic_id: payload.topic_id,
          topic_name: payload.topic_name,
          questions
        }
      })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async sendCodeQuestions(req, res) {
    try {
      const {
        topic_name,
        programming_language,
        number_of_questions,
        skills = []
      } = req.body || {}

      if (!topic_name || !programming_language) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: topic_name, programming_language'
        })
      }

      const questionCount = Number(number_of_questions) > 0 ? Number(number_of_questions) : 1

      const generated = await geminiService.generateCodingQuestion(
        topic_name,
        Array.isArray(skills) ? skills : [],
        questionCount,
        programming_language,
        {
          humanLanguage: 'en',
          topic_id: null
        }
      )

      const questionArray = Array.isArray(generated) ? generated : generated ? [generated] : []

      const ladder = buildDifficultyLadder(questionArray.length || questionCount)

      const sanitizedQuestions = questionArray
        .filter(Boolean)
        .map((item, index) => ({
          id: `assessment_code_${index + 1}`,
          topic_name,
          programming_language,
          question: item?.description || item?.title,
          difficulty: item?.difficulty || ladder[index] || ladder[ladder.length - 1] || 'basic',
          test_cases: (item?.testCases || []).map((tc) => ({
            input: tc.input,
            expected_output: tc.expected_output || tc.output
          })),
          judge0: {
            language: programming_language,
            runtime: programming_language,
            sandbox: true
          }
        }))

      const questionsWithPresentation = sanitizedQuestions.map((question) =>
        addPresentationToQuestion(question, {
          id: question.id,
          questionType: 'code',
          title: topic_name ? `${topic_name} Coding Challenge` : 'Coding Challenge',
          prompt: question.question,
          topicName: topic_name,
          difficulty: question.difficulty,
          programmingLanguage: programming_language,
          testCases: question.test_cases,
          hints: [],
          features: {
            hints: false,
            submit: false,
            proctoring: false,
            sandbox: true,
            runTests: true
          }
        })
      )

      if (!sanitizedQuestions.length) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate coding questions for Assessment microservice'
        })
      }

      const requestId = createRequestId()

      await saveTempQuestions({
        requestId,
        requesterService: 'assessment',
        action: 'code',
        questions: questionsWithPresentation,
        metadata: {
          topic_name,
          programming_language,
          number_of_questions: questionCount,
          skills: Array.isArray(skills) ? skills : []
        }
      })

      return res.json({
        success: true,
        data: {
          questions: questionsWithPresentation,
          metadata: {
            topic_name,
            programming_language,
            requested: questionCount,
            skills: Array.isArray(skills) ? skills : [],
            request_id: requestId
          }
        },
        request_id: requestId
      })
    } catch (error) {
      console.error('Assessment sendCodeQuestions error:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async sendCodingQuestionsWithOpenAI(req, res) {
    try {
      const {
        amount = 1,
        difficulty = 'medium',
        humanLanguage = 'en',
        skills = [],
        programming_language,
        assessment_id,
        assessmentId
      } = req.body?.payload || req.body || {}

      if (!programming_language) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: programming_language'
        })
      }

      const questionCount = Number(amount) > 0 ? Number(amount) : 1
      const normalizedSkills = Array.isArray(skills) ? skills : []
      const assessmentIdValue = assessment_id || assessmentId

      // Generate questions using OpenAI
      const generated = await openAIService.generateAssessmentCoding(
        questionCount,
        difficulty,
        humanLanguage,
        normalizedSkills,
        programming_language
      )

      const questionArray = Array.isArray(generated) ? generated : generated ? [generated] : []

      if (!questionArray.length) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate coding questions using OpenAI'
        })
      }

      // Format questions for response
      const formattedQuestions = questionArray.map((item, index) => {
        const normalizedTestCases = (item.testCases || []).map((tc) => ({
          input: tc.input,
          expected_output: tc.expected_output || tc.output
        }))

        return {
          id: `assessment_coding_${index + 1}`,
          title: item.title || `Coding Question ${index + 1}`,
          description: item.description || '',
          difficulty: item.difficulty || difficulty,
          programming_language: item.language || programming_language,
          skills: item.skills || normalizedSkills,
          testCases: normalizedTestCases,
          test_cases: normalizedTestCases,
          judge0: {
            enabled: true,
            instructions:
              'Send the user solution and these test cases to the Judge0 API endpoints to run automated code validation.',
            language: (item.language || programming_language || 'javascript').toLowerCase(),
            humanLanguage,
            endpoints: {
              execute: '/api/judge0/execute',
              runAllTestCases: '/api/judge0/test-cases'
            },
            testCases: normalizedTestCases
          }
        }
      })

      // Save questions to Supabase (without answers)
      if (assessmentIdValue) {
        try {
          await saveAssessmentCodeQuestions(formattedQuestions, assessmentIdValue)
        } catch (saveError) {
          console.error('Error saving questions to Supabase:', saveError)
          // Continue even if save fails
        }
      } else {
        console.warn('No assessmentId provided, questions not saved to Supabase')
      }

      // Render the component as HTML
      const componentHtml = renderAssessmentCodeQuestions(formattedQuestions)

      // Return questions in the format expected by the ASSESSMENT service
      // The response should be wrapped in { response: { answers: "<component>" } }
      return res.json({
        success: true,
        questions: formattedQuestions,
        componentHtml,
        metadata: {
          amount: questionCount,
          difficulty,
          humanLanguage,
          programming_language,
          skills: normalizedSkills
        }
      })
    } catch (error) {
      console.error('Assessment sendCodingQuestionsWithOpenAI error:', error)
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async updateQuestionStatus(req, res) {
    try {
      const { questionId } = req.params
      const { status } = req.body
      res.json({ success: true, message: 'Question status updated' })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async confirmQuestions(req, res) {
    try {
      const { request_id, requester_service = 'assessment' } = req.body || {}

      if (!request_id) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: request_id'
        })
      }

      const removed = await confirmTempQuestions({
        requestId: request_id,
        requesterService: requester_service
      })

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Temporary question batch not found or already confirmed'
        })
      }

      res.json({ success: true, request_id })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  },

  async gradeAssessmentSolutions(req, res) {
    try {
      const { questions, solutions, skills } = req.body || {}

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid questions array'
        })
      }

      if (!Array.isArray(solutions) || solutions.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid solutions array'
        })
      }

      if (questions.length !== solutions.length) {
        return res.status(400).json({
          success: false,
          error: 'Questions and solutions arrays must have the same length'
        })
      }

      // Extract all unique skills from questions if not provided
      const allSkills = Array.isArray(skills) && skills.length > 0
        ? skills
        : Array.from(new Set(questions.flatMap(q => q.skills || [])))

      // Grade solutions using OpenAI (centralized evaluation logic)
      const evaluation = await openAIService.gradeAssessmentSolutions(
        questions,
        solutions,
        allSkills
      )

      res.json({
        success: true,
        data: {
          // Ensure we always expose a single numeric score
          score: typeof evaluation?.score === 'number' ? evaluation.score : 0
        }
      })
    } catch (error) {
      console.error('Assessment gradeAssessmentSolutions error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to grade assessment solutions'
      })
    }
  },

  async deleteCodeQuestions(req, res) {
    try {
      const { assessmentId } = req.params

      if (!assessmentId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: assessmentId'
        })
      }

      // Import postgres here to avoid circular dependencies
      const { postgres } = await import('../../config/database.js')

      // Delete questions from Supabase
      const result = await postgres.query(
        `DELETE FROM "assessment_codeQuestions" WHERE "assessment_id" = $1`,
        [assessmentId]
      )

      console.log(`[deleteCodeQuestions] Deleted ${result.rowCount} questions for assessment ${assessmentId}`)

      res.json({
        success: true,
        message: `Successfully deleted ${result.rowCount} question(s) for assessment ${assessmentId}`,
        deletedCount: result.rowCount
      })
    } catch (error) {
      console.error('Assessment deleteCodeQuestions error:', error)
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete code questions'
      })
    }
  }
}

