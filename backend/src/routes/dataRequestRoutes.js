import express from 'express'
import { authenticateService } from '../middleware/auth.js'
import { contentStudioHandlers } from './contentStudio/contentStudioRoutes.js'
import { assessmentController } from '../controllers/external/assessmentController.js'
import { learningAnalyticsController } from '../controllers/external/learningAnalyticsController.js'
import { courseBuilderController } from '../controllers/external/courseBuilderController.js'
import { competitionController } from '../controllers/competitionController.js'
import {
  createRequestId,
  saveTempQuestions
} from '../services/tempQuestionStore.js'
import { generateCodeContentStudioComponent } from '../utils/codeContentStudioRender.js'
import { postToCoordinator } from '../infrastructure/coordinatorClient/coordinatorClient.js'

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

  // Route code question generation to preview component generator
  if (action === 'generate-questions' && payload?.question_type === 'code') {
    try {
      const {
        topic_id,
        topic_name,
        topicName,
        programming_language,
        programmingLanguage,
        amount = 3,
        skills = [],
        humanLanguage = 'en'
      } = payload || {}

      const resolvedTopicId = typeof topic_id === 'number' || typeof topic_id === 'string'
        ? topic_id
        : null

      const resolvedTopicName = topic_name || topicName || null

      if (!resolvedTopicId || !resolvedTopicName) {
        return {
          statusCode: 400,
          payload: {
            success: false,
            error: 'Missing required fields: topic_id, topic_name'
          }
        }
      }

      const safeAmount = Number(amount) > 0 ? Number(amount) : 3
      const normalizedSkills = Array.isArray(skills) ? skills : []

      const html = await generateCodeContentStudioComponent({
        topicName: resolvedTopicName,
        topic_id: resolvedTopicId,
        amount: safeAmount,
        programming_language: programming_language || programmingLanguage || 'javascript',
        skills: normalizedSkills,
        humanLanguage
      })

      return {
        statusCode: 200,
        payload: {
          success: true,
          html
        }
      }
    } catch (error) {
      console.error('❌ Error generating Content Studio code component via data-request:', error)
      return {
        statusCode: 500,
        payload: {
          success: false,
          error: 'Failed to generate Content Studio code component',
          message: error?.message
        }
      }
    }
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
    case 'coding':
      return executeHandler(assessmentController.sendCodingQuestionsWithOpenAI, { body: payload })
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
  // Forward EXACTLY to the existing competitions course-completion handler
  return executeHandler(competitionController.recordCourseCompletion, { body: payload })
}

const handlersByService = {
  'content-studio': contentStudioHandler,
  assessment: assessmentHandler,
  analytics: analyticsHandler,
  'course-builder': courseBuilderHandler
}

// Accept raw text body specifically for this endpoint to comply with external microservices contract
router.post('/fill-content-metrics', express.text({ type: '*/*' }), async (req, res) => {
  try {
    // Step 1: Parse entire body as stringified JSON
    let parsed
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      parsed = JSON.parse(rawBody)
      console.log('📦 [data-request] Parsed body preview:', JSON.stringify(parsed).slice(0, 500))
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

    // Early interception: Forward theoretical question requests from Content Studio to Coordinator
    if (
      requester_service === 'content-studio' &&
      payload?.action === 'generate-questions' &&
      payload?.question_type === 'theoretical'
    ) {
      try {
        console.log('📤 [data-request] Forwarding theoretical question request to Coordinator')
        const coordinatorResponse = await postToCoordinator(parsed, {
          endpoint: '/api/fill-content-metrics/'
        })
        return res.status(200).type('application/json').send(JSON.stringify(coordinatorResponse))
      } catch (error) {
        console.error('❌ [data-request] Failed to forward theoretical question request to Coordinator:', {
          error: error.message,
          status: error.response?.status,
          responseData: error.response?.data
        })
        // Return error in the expected format
        parsed.response = responseObject
        parsed.response.answer = JSON.stringify({
          success: false,
          error: 'Failed to forward request to Coordinator',
          details: error.message
        })
        return res.status(500).type('application/json').send(JSON.stringify(parsed))
      }
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
    
    // If content-studio code question generation was requested, place HTML component in response.answer
    if (requester_service === 'content-studio' && payload?.action === 'generate-questions' && payload?.question_type === 'code') {
      const componentHtml = responsePayload?.html || ''
      // The response.answer should contain the component HTML that will be sent back to content-studio
      parsed.response.answer = componentHtml
    } else if (requester_service === 'assessment' && payload?.action === 'coding') {
      const componentHtml = responsePayload?.componentHtml || ''
      // The response.answer should contain the component HTML that will be sent back to assessment
      parsed.response.answer = componentHtml
    } else if (requester_service === 'assessment' && payload?.action === 'theoretical') {
      const extractQuestions = (data) => {
        if (!data) return []
        if (Array.isArray(data)) return data
        if (Array.isArray(data.questions)) return data.questions
        if (data.data && Array.isArray(data.data.questions)) return data.data.questions
        return []
      }
      
      const questions = extractQuestions(responsePayload)
      const requestId = createRequestId()
      const metadata = {
        generated_at: new Date().toISOString(),
        topic_id: payload?.topic_id,
        topic_name: payload?.topic_name,
        amount: payload?.amount,
        humanLanguage: payload?.humanLanguage,
        skills: Array.isArray(payload?.skills) ? payload.skills : [],
        source: 'assessment_service'
      }
      
      try {
        await saveTempQuestions({
          requestId,
          requesterService: 'content-studio',
          action: 'theoretical',
          questions,
          metadata
        })
      } catch (e) {
        metadata.warning = `Temporary save failed: ${e?.message || 'unknown error'}`
      }
      
      const wrappedAnswer = {
        success: true,
        request_id: requestId,
        data: {
          questions,
          metadata
        }
      }
      parsed.response.answer = JSON.stringify(wrappedAnswer)
    } else if (requester_service === 'content-studio' && payload?.action === 'validate-question') {
      if (typeof responsePayload?.componentHtml === 'string' && responsePayload.componentHtml.trim()) {
        parsed.response.answer = responsePayload.componentHtml
      } else {
        parsed.response.answer = JSON.stringify(responsePayload)
      }
    } else if (requester_service === 'course-builder') {
      // For Course Builder, do not populate response.answer; return wrapper as-is
      parsed.response.answer = typeof parsed.response.answer === 'string' ? parsed.response.answer : ''
    } else {
      // Default behavior for other services/actions
      parsed.response.answer = JSON.stringify(responsePayload)
    }

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

