import { geminiService } from '../../services/gemini.js'
import { mockMicroservices } from '../../services/mockMicroservices.js'
import {
  createRequestId,
  saveTempQuestions,
  confirmTempQuestions
} from '../../services/tempQuestionStore.js'

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

export const assessmentController = {
  async getTheoreticalQuestions(req, res) {
    try {
      const questions = [
        {
          id: 'tq-1',
          title: 'What is Python?',
          description: 'Explain what Python is and its main features.',
          type: 'theoretical',
          difficulty: 'beginner',
          courseId: '1',
          topicId: '1'
        }
      ]

      const requestId = createRequestId()

      await saveTempQuestions({
        requestId,
        requesterService: 'assessment',
        action: 'theoretical',
        questions,
        metadata: {
          source: 'assessment',
          question_type: 'theoretical'
        }
      })

      res.json({ success: true, request_id: requestId, data: questions })
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

      const questionPayload =
        questionCount > 1
          ? await geminiService.generateMultipleCodingQuestions(
              topic_name,
              'intermediate',
              programming_language,
              nano_skills,
              micro_skills,
              questionCount
            )
          : [
              await geminiService.generateCodingQuestion(
                topic_name,
                'intermediate',
                programming_language,
                nano_skills,
                micro_skills
              )
            ]

      const ladder = buildDifficultyLadder(questionPayload.length || questionCount)

      const sanitizedQuestions = questionPayload
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
        questions: sanitizedQuestions,
        metadata: {
          topic_name,
          programming_language,
          number_of_questions: questionCount
        }
      })

      return res.json({
        success: true,
        data: {
          questions: sanitizedQuestions,
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

