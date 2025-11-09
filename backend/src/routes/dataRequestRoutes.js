import express from 'express'
import { authenticateService } from '../middleware/auth.js'
import { contentStudioHandlers } from './contentStudio/contentStudioRoutes.js'
import { assessmentController } from '../controllers/external/assessmentController.js'
import { learningAnalyticsController } from '../controllers/external/learningAnalyticsController.js'
import { courseBuilderController } from '../controllers/external/courseBuilderController.js'

const router = express.Router()

router.use(authenticateService)

const executeHandler = (handler, { body = {}, params = {}, query = {} } = {}) =>
  new Promise((resolve, reject) => {
    let statusCode = 200
    const req = { body, params, query }
    const res = {
      status(code) {
        statusCode = code
        return this
      },
      json(payload) {
        resolve({ statusCode, payload })
      }
    }

    Promise.resolve(handler(req, res)).catch(reject)
  })

const contentStudioHandler = async (payload) => {
  const action = payload?.action
  if (!action) {
    throw new Error('Missing action for content-studio payload')
  }

  switch (action) {
    case 'generate-questions':
      return executeHandler(contentStudioHandlers.generateQuestions, { body: payload })
    case 'check-solution':
      return executeHandler(contentStudioHandlers.checkSolution, { body: payload })
    case 'validate-question':
      return executeHandler(contentStudioHandlers.validateQuestion, { body: payload })
    case 'get-question-feedback':
      return executeHandler(contentStudioHandlers.getQuestionFeedback, { body: payload })
    case 'confirm-questions':
      return executeHandler(contentStudioHandlers.confirmQuestions, { body: payload })
    default:
      throw new Error(`Unknown content-studio action: ${action}`)
  }
}

const assessmentHandler = async (payload) => {
  const action = payload?.action
  if (!action) {
    throw new Error('Missing action for assessment payload')
  }

  switch (action) {
    case 'theoretical':
      return executeHandler(assessmentController.getTheoreticalQuestions, { body: payload })
    case 'code':
      return executeHandler(assessmentController.sendCodeQuestions, { body: payload })
    case 'update-question-status': {
      const questionId = payload?.questionId || payload?.question_id
      if (!questionId) {
        throw new Error('Missing questionId for assessment update-question-status')
      }
      return executeHandler(assessmentController.updateQuestionStatus, {
        params: { questionId },
        body: payload
      })
    }
    case 'confirm-questions':
      return executeHandler(assessmentController.confirmQuestions, { body: payload })
    default:
      throw new Error(`Unknown assessment action: ${action}`)
  }
}

const analyticsHandler = async (payload) => {
  return executeHandler(learningAnalyticsController.sendCompetitionSummary, { body: payload })
}

const courseBuilderHandler = async (payload) => {
  return executeHandler(courseBuilderController.handleCourseCompletion, { body: payload })
}

const handlersByService = {
  'content-studio': contentStudioHandler,
  assessment: assessmentHandler,
  analytics: analyticsHandler,
  'course-builder': courseBuilderHandler
}

router.post('/data-request', async (req, res) => {
  try {
    const { requester_service, payload } = req.body || {}

    if (!requester_service || !payload) {
      return res
        .status(400)
        .json({ success: false, error: 'Missing requester_service or payload' })
    }

    const handler = handlersByService[requester_service]

    if (!handler) {
      return res.status(400).json({ success: false, error: 'Unknown requester_service' })
    }

    const { statusCode, payload: responsePayload } = await handler(payload)
    return res.status(statusCode).json(responsePayload)
  } catch (error) {
    console.error('Data request gateway error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process data request',
      details: error.message
    })
  }
})

export default router

