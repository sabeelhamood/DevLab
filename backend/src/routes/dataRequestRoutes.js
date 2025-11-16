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

// Accept raw text body specifically for this endpoint to comply with external microservices contract
router.post('/data-request', express.text({ type: '*/*' }), async (req, res) => {
  try {
    // Step 1: Parse entire body as stringified JSON
    let parsed
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      parsed = JSON.parse(rawBody)
    } catch (parseError) {
      return res
        .status(400)
        .type('application/json')
        .send(JSON.stringify({ error: 'Invalid JSON: request body must be a stringified JSON object' }))
    }

    // Step 2: Validate required structure
    const { requester_service, payload, response } = parsed || {}
    const responseObject = typeof response === 'object' && response !== null ? response : { answer: '' }
    if (
      typeof requester_service !== 'string' ||
      typeof payload !== 'object' ||
      payload === null ||
      typeof responseObject !== 'object' ||
      !Object.prototype.hasOwnProperty.call(responseObject, 'answer')
    ) {
      return res
        .status(400)
        .type('application/json')
        .send(
          JSON.stringify({
            error:
              'Missing required fields: requester_service (string), payload (object), response (object with "answer")'
          })
        )
    }

    const handler = handlersByService[requester_service]

    if (!handler) {
      // Preserve original object and place error in response.answer
      parsed.response = responseObject
      parsed.response.answer = JSON.stringify({ success: false, error: 'Unknown requester_service' })
      return res.status(400).type('application/json').send(JSON.stringify(parsed))
    }

    // Step 3: Execute handler and place result into response.answer
    const { statusCode, payload: responsePayload } = await handler(payload)
    parsed.response = responseObject
    parsed.response.answer = JSON.stringify(responsePayload)

    // Step 4: Return the full object as stringified JSON
    return res.status(statusCode).type('application/json').send(JSON.stringify(parsed))
  } catch (error) {
    console.error('Data request gateway error:', error)
    // Best-effort: return structured error while preserving top-level shape when possible
    try {
      const fallback = {
        requester_service: undefined,
        payload: undefined,
        response: { answer: JSON.stringify({ success: false, error: 'Failed to process data request', details: error.message }) }
      }
      return res.status(500).type('application/json').send(JSON.stringify(fallback))
    } catch {
      return res.status(500).type('application/json').send(JSON.stringify({ error: 'Internal Server Error' }))
    }
  }
})

export default router

