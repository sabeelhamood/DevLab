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
  difficulty = 'intermediate',
  humanLanguage = 'en',
  skills = []
}) => {
  const fallback = () =>
    mockMicroservices.assessmentService.generateQuestions(topic_id, amount, difficulty) || []

  if (!assessmentBaseUrl) {
    return fallback()
  }

  try {
    const response = await fetch(
      `${assessmentBaseUrl}/api/questions/theoretical`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          buildAssessmentPayload({
            topic_id,
            topic_name,
            amount,
            difficulty,
            humanLanguage,
            skills
          })
        )
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText)
      throw new Error(
        `Assessment service responded with ${response.status}: ${errorText}`
      )
    }

    const responseBody = await response.json().catch(() => ({}))
    const questions = extractQuestions(responseBody)

    if (!Array.isArray(questions) || !questions.length) {
      throw new Error('Assessment service returned an empty question set')
    }

    return questions
  } catch (error) {
    console.error('Assessment theoretical fetch failed:', error.message)
    return fallback()
  }
}


