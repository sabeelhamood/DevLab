import fetch from 'node-fetch'

import { config } from '../config/environment.js'
import { mockMicroservices } from './mockMicroservices.js'

const normalizeBaseUrl = (url = '') => url.replace(/\/+$/, '')

const assessmentBaseUrl = normalizeBaseUrl(config.externalServices.assessment || '')

const buildAssessmentPayload = ({
  topic_id,
  topic_name,
  amount,
  difficulty,
  humanLanguage,
  skills = []
}) => ({
  topic_id,
  topicId: topic_id,
  topic_name,
  topicName: topic_name,
  amount,
  number_of_questions: amount,
  difficulty,
  humanLanguage,
  skills
})

const extractQuestions = (responseBody) => {
  if (!responseBody) {
    return []
  }

  if (Array.isArray(responseBody)) {
    return responseBody
  }

  if (Array.isArray(responseBody.questions)) {
    return responseBody.questions
  }

  if (responseBody.data && Array.isArray(responseBody.data.questions)) {
    return responseBody.data.questions
  }

  return []
}

export const fetchAssessmentTheoreticalQuestions = async ({
  topic_id,
  topic_name,
  amount,
  difficulty = 'in ascending order of difficulty',
  humanLanguage = 'en',
  skills = []
}) => {
  const fallback = () =>
    mockMicroservices.assessmentService.generateQuestions(topic_id, amount, difficulty) || []

  if (!assessmentBaseUrl) {
    return fallback()
  }

  // Build the generic gateway request body (must be stringified as a single value)
  const gatewayBodyObject = {
    requester_service: 'devlab',
    payload: {
      action: 'theoretical',
      topic_id,
      topic_name,
      amount,
      difficulty,
      humanLanguage,
      skills: Array.isArray(skills) ? skills : []
    },
    response: { answer: '' }
  }

  const rawBody = JSON.stringify(gatewayBodyObject)

  try {
    const headers = {
      'Content-Type': 'text/plain'
    }

    // Optional service auth headers if present in environment
    const serviceApiKey = process.env['SERVICE_API_KEY'] || ''
    const serviceId = process.env['SERVICE_ID'] || 'assessment-service'
    if (serviceApiKey) {
      headers['x-api-key'] = serviceApiKey
      headers['x-service-id'] = serviceId
    }

    // Use the Assessment microservice's generic endpoint for theoretical questions
    const response = await fetch(`${assessmentBaseUrl}/api/fill-content-metrics`, {
      method: 'POST',
      headers,
      body: rawBody
    })

    // Parse outer wrapper (full object with response.answer)
    const result = await response.json().catch(async () => {
      const text = await response.text().catch(() => '')
      throw new Error(`Invalid JSON from gateway: ${text || response.statusText}`)
    })

    // Extract and parse the inner answer (string)
    let answer
    try {
      answer = result?.response?.answer ? JSON.parse(result.response.answer) : null
    } catch (err) {
      throw new Error(`Invalid inner answer JSON from gateway: ${err.message}`)
    }

    if (!response.ok) {
      const errMsg = typeof answer === 'object' && answer && (answer.error || answer.message)
        ? `${response.status}: ${answer.error || answer.message}`
        : `${response.status}: ${response.statusText}`
      throw new Error(`Gateway error: ${errMsg}`)
    }

    const questions = extractQuestions(answer)
    if (!Array.isArray(questions) || !questions.length) {
      throw new Error('Gateway returned empty questions from assessment')
    }

    return questions
  } catch (error) {
    console.error('Assessment theoretical fetch via gateway failed:', error.message)
    return fallback()
  }
}


