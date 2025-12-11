import express from 'express'
import { authenticateSignature } from '../middleware/signatureAuth.js'
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
import { postToCoordinator, generateSignatureHeaders } from '../infrastructure/coordinatorClient/coordinatorClient.js'
import { openAIContentStudioService } from '../services/openAIContentStudioService.js'

const router = express.Router()

// Use signature-based authentication instead of API key
router.use(authenticateSignature)

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
      const resolvedProgrammingLanguage = programming_language || programmingLanguage || 'javascript'

      // Step 1: Generate questions array first (needed for temp_questions saving)
      const questions = await openAIContentStudioService.generateContentStudioCodingQuestions(
        resolvedTopicName,
        normalizedSkills,
        safeAmount,
        resolvedProgrammingLanguage,
        {
          humanLanguage,
          topic_id: resolvedTopicId
        }
      )

      // Step 2: Generate HTML component (existing behavior)
      const html = await generateCodeContentStudioComponent({
        topicName: resolvedTopicName,
        topic_id: resolvedTopicId,
        amount: safeAmount,
        programming_language: resolvedProgrammingLanguage,
        skills: normalizedSkills,
        humanLanguage
      })

      // Step 3: Create requestId and save to temp_questions (matching theoretical questions flow)
      const requestId = createRequestId()
      const metadata = {
        generated_at: new Date().toISOString(),
        topic_id: resolvedTopicId,
        topic_name: resolvedTopicName,
        amount: safeAmount,
        humanLanguage,
        skills: normalizedSkills,
        programming_language: resolvedProgrammingLanguage,
        question_type: 'code',
        source: 'content-studio'
      }

      try {
        await saveTempQuestions({
          requestId,
          requesterService: 'content-studio',
          action: 'generate-questions',
          questions,
          metadata
        })
      } catch (e) {
        console.error('❌ Error saving code questions to temp_questions:', e)
        metadata.warning = `Temporary save failed: ${e?.message || 'unknown error'}`
      }

      // Step 4: Return wrapped response (matching theoretical questions structure)
      return {
        statusCode: 200,
        payload: {
          success: true,
          html,  // Keep for backward compatibility
          request_id: requestId,
          questions,
          metadata
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
  // Pull model: Learning Analytics requests competition data
  // Query competitions_vs_ai table based on filters in payload
  return executeHandler(learningAnalyticsController.queryCompetitions, { body: payload })
}

const courseBuilderHandler = async (payload) => {
  console.log('📦 [course-builder] Handler called with payload:', JSON.stringify(payload, null, 2))
  // Forward EXACTLY to the existing competitions course-completion handler
  return executeHandler(competitionController.recordCourseCompletion, { body: payload })
}

const handlersByService = {
  'content-studio': contentStudioHandler,
  assessment: assessmentHandler,
  analytics: analyticsHandler,
  'course_builder': courseBuilderHandler
}

// Accept raw text body specifically for this endpoint to comply with external microservices contract
router.post(['/fill-content-metrics', '/fill-content-metrics/', '/api/fill-content-metrics', '/api/fill-content-metrics/'], express.text({ type: '*/*' }), async (req, res) => {
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
    let statusCode, responsePayload
    try {
      const result = await handler(payload)
      statusCode = result.statusCode
      responsePayload = result.payload
      console.log(`[data-request] Handler returned: statusCode=${statusCode}, payload keys:`, Object.keys(responsePayload || {}))
    } catch (handlerError) {
      console.error('[data-request] Handler execution failed:', handlerError)
      console.error('[data-request] Handler error stack:', handlerError.stack)
      // If handler throws, return 500 error
      parsed.response = responseObject
      parsed.response.answer = JSON.stringify({
        success: false,
        error: 'Handler execution failed',
        details: handlerError.message
      })
      return res.status(500).type('application/json').send(JSON.stringify(parsed))
    }
    parsed.response = responseObject
    
    // If content-studio code question generation was requested, wrap response like theoretical questions
    if (requester_service === 'content-studio' && payload?.action === 'generate-questions' && payload?.question_type === 'code') {
      // If responsePayload has the wrapped structure (with request_id), use it (new behavior)
      if (responsePayload?.request_id && responsePayload?.questions) {
        const wrappedAnswer = {
          success: true,
          request_id: responsePayload.request_id,
          data: {
            questions: responsePayload.questions,
            metadata: responsePayload.metadata || {},
            html: responsePayload.html || ''
          }
        }
        parsed.response.answer = JSON.stringify(wrappedAnswer)
      } else {
        // Fallback: just HTML (backward compatibility for old responses)
        const componentHtml = responsePayload?.html || ''
        parsed.response.answer = componentHtml
      }
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
    } else if (requester_service === 'course_builder') {
      // For Course Builder, do not populate response.answer; return wrapper as-is
      parsed.response.answer = typeof parsed.response.answer === 'string' ? parsed.response.answer : ''
    } else {
      // Default behavior for other services/actions
      parsed.response.answer = JSON.stringify(responsePayload)
    }

    // Step 4: Sign the response envelope before sending back to Coordinator
    try {
      console.log('[data-request] Signing response envelope before sending')
      const signatureHeaders = generateSignatureHeaders(parsed)
      console.log('[data-request] Signature headers generated successfully')
      console.log('[data-request] Sending response with statusCode:', statusCode)
      return res
        .status(statusCode)
        .type('application/json')
        .set(signatureHeaders)
        .send(JSON.stringify(parsed))
    } catch (signError) {
      console.error('[data-request] Failed to sign response envelope:', signError.message)
      console.error('[data-request] Sign error stack:', signError.stack)
      // If signing fails, still return the response but log the error
      return res.status(statusCode).type('application/json').send(JSON.stringify(parsed))
    }
  } catch (error) {
    console.error('Data request gateway error:', error)
    // Best-effort: return structured error while preserving top-level shape when possible
    try {
      const fallback = {
        requester_service: undefined,
        payload: undefined,
        response: { answer: JSON.stringify({ success: false, error: 'Failed to process data request', details: error.message }) }
      }
      // Sign error response if possible
      try {
        const signatureHeaders = generateSignatureHeaders(fallback)
        return res
          .status(500)
          .type('application/json')
          .set(signatureHeaders)
          .send(JSON.stringify(fallback))
      } catch (signError) {
        console.error('[data-request] Failed to sign error response:', signError.message)
        return res.status(500).type('application/json').send(JSON.stringify(fallback))
      }
    } catch {
      return res.status(500).type('application/json').send(JSON.stringify({ error: 'Internal Server Error' }))
    }
  }
})

export default router

