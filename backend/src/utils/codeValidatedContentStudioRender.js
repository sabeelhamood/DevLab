import { generateCodeContentStudioComponent } from './codeContentStudioRender.js'
import { openAIContentStudioService } from '../services/openAIContentStudioService.js'
import { saveTempQuestions, createRequestId } from '../services/tempQuestionStore.js'

/**
 * Render already-validated coding questions (from transformTrainerExercisesOpenAI)
 * using the existing Content Studio renderer without modifying its implementation.
 *
 * @param {Object} options
 * @param {string} options.topicName
 * @param {number|string} options.topic_id
 * @param {string} [options.programming_language='javascript']
 * @param {Array<string>} [options.skills=[]]
 * @param {string} [options.humanLanguage='en']
 * @param {Array<Object>} options.questions - Structured coding questions produced by OpenAI
 * @returns {Promise<string>} Rendered HTML + JS payload identical to the legacy renderer output
 */
export async function generateValidatedCodeContentStudioComponent({
  topicName,
  topic_id,
  programming_language = 'javascript',
  skills = [],
  humanLanguage = 'en',
  questions = []
}) {
  const preparedQuestions = Array.isArray(questions) ? questions.filter(Boolean) : []
  if (!preparedQuestions.length) {
    throw new Error('generateValidatedCodeContentStudioComponent requires at least one question')
  }

  const originalGenerator = openAIContentStudioService.generateContentStudioCodingQuestions

  openAIContentStudioService.generateContentStudioCodingQuestions = async function (...args) {
    // Short-circuit the normal OpenAI generation and reuse the validated questions instead.
    // This keeps all downstream rendering logic intact without touching the source file.
    if (preparedQuestions.length) {
      return preparedQuestions
    }
    return originalGenerator.apply(this, args)
  }

  try {
    const html = await generateCodeContentStudioComponent({
      topicName,
      topic_id,
      amount: preparedQuestions.length,
      programming_language,
      skills,
      humanLanguage
    })

    // Save validated questions to temp_questions table (non-blocking)
    const requestId = createRequestId()
    saveTempQuestions({
      requestId,
      requesterService: 'content-studio',
      action: 'validate-question',
      questions: preparedQuestions,
      metadata: {
        topic_id,
        topic_name: topicName,
        question_type: 'code',
        programming_language,
        skills: Array.isArray(skills) ? skills : [],
        humanLanguage,
        generated_at: new Date().toISOString(),
        source: 'content-studio-validated'
      }
    }).catch((error) => {
      console.error('[codeValidatedContentStudioRender] Failed to save temp questions:', error)
      // Don't throw - this is a background operation
    })

    return html
  } finally {
    openAIContentStudioService.generateContentStudioCodingQuestions = originalGenerator
  }
}


