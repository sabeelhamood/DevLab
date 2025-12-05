import { postToCoordinator } from '../infrastructure/coordinatorClient/coordinatorClient.js'
import { mockMicroservices } from './mockMicroservices.js'

const SERVICE_NAME = process.env.SERVICE_NAME || 'devlab-service'

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

  // Check if Coordinator is configured
  if (!process.env.COORDINATOR_URL) {
    console.warn('COORDINATOR_URL not configured, using fallback for Assessment theoretical questions');
    return fallback();
  }

  // Build the envelope for Coordinator
  const envelope = {
    requester_service: SERVICE_NAME,
    payload: {
      action: 'theoretical',
      topic_id,
      topic_name,
      amount,
      difficulty,
      humanLanguage,
      skills: Array.isArray(skills) ? skills : []
    },
    response: {}
  }

  try {
    // Call Assessment service via Coordinator
    const result = await postToCoordinator(envelope, {
      endpoint: '/api/fill-content-metrics/',
      timeout: 30000
    });

    // Extract the response from Coordinator
    // Coordinator fills the response field with the target service's response
    let answer;
    if (result?.response?.answer) {
      // If answer is a string, parse it
      if (typeof result.response.answer === 'string') {
        try {
          answer = JSON.parse(result.response.answer);
        } catch (parseError) {
          // If parsing fails, use the string as-is
          answer = result.response.answer;
        }
      } else {
        // If answer is already an object, use it directly
        answer = result.response.answer;
      }
    } else if (result?.response) {
      // If response is directly an object (not nested in answer)
      answer = result.response;
    } else {
      // Fallback to the entire result
      answer = result;
    }

    const questions = extractQuestions(answer);
    if (!Array.isArray(questions) || !questions.length) {
      throw new Error('Coordinator returned empty questions from assessment');
    }

    return questions;
  } catch (error) {
    console.error('Assessment theoretical fetch via Coordinator failed:', error.message);
    return fallback();
  }
}


