import { geminiService } from '../../services/gemini.js'
import {
  createRequestId,
  saveTempQuestions,
  confirmTempQuestions
} from '../../services/tempQuestionStore.js'
import { fetchAssessmentTheoreticalQuestions } from '../../services/assessmentClient.js'
import { addPresentationToQuestion } from '../../utils/questionPresentation.js'

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
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return [value]
    }
  }

  return []
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
        nanoSkills:
          parseSkills(
            req.body?.nano_skills ||
              req.body?.nanoSkills ||
              req.query?.nano_skills ||
              req.query?.nanoSkills
          ),
        microSkills:
          parseSkills(
            req.body?.micro_skills ||
              req.body?.microSkills ||
              req.query?.micro_skills ||
              req.query?.microSkills
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
        nano_skills = [],
        micro_skills = []
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
        [...nano_skills, ...micro_skills],
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
          number_of_questions: questionCount
        }
      })

      // Remove deprecated fields from all questions
      const cleanedQuestions = questionsWithPresentation.map(q => {
        const cleaned = { ...q }
        delete cleaned.nanoSkills
        delete cleaned.macroSkills
        delete cleaned.nano_skills
        delete cleaned.macro_skills
        delete cleaned.courseName // Remove courseName - no longer used
        // Ensure skills field exists
        if (!cleaned.skills) {
          cleaned.skills = []
        }
        return cleaned
      })

      return res.json({
        success: true,
        data: {
          questions: cleanedQuestions,
          metadata: {
            topic_name,
            programming_language,
            requested: questionCount,
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
  }
}

