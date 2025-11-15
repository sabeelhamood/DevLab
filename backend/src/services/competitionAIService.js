import { buildCompetitionQuestionsPrompt } from '../prompts/competitionPrompts.js'
import { getFetch } from '../utils/http.js'

class CompetitionAIService {
  async generateCompetitionQuestions({ courseName }) {
    const apiUrl = process.env.DEVLAB_GPT_API_URL || process.env.DEVLAB_GPT_API
    if (!apiUrl) {
      throw new Error('DEVLAB_GPT_API_URL environment variable is not configured')
    }

    const apiKey = process.env.DEVLAB_GPT_API_KEY || process.env.DEVLAB_GPT_API_TOKEN
    const fetchFn = await getFetch()
    const prompt = buildCompetitionQuestionsPrompt(courseName)

    const headers = {
      'Content-Type': 'application/json',
      // 🔥 Force OPENAI model
      'x-devlab-gpt-model': 'gpt-4.1'
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    // 🔥 Send explicit model to ensure the API knows we want OpenAI
    const body = JSON.stringify({
      prompt,
      model: 'gpt-4.1'
    })

    const response = await fetchFn(apiUrl, {
      method: 'POST',
      headers,
      body
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(
        `DEVLAB_GPT_API responded with status ${response.status}: ${responseText || 'No response body'}`
      )
    }

    let parsed
    try {
      parsed = JSON.parse(responseText)
    } catch (error) {
      throw new Error('DEVLAB_GPT_API returned invalid JSON')
    }

    let questionsPayload = parsed

    if (typeof parsed === 'string') {
      try {
        questionsPayload = JSON.parse(parsed)
      } catch {
        throw new Error('DEVLAB_GPT_API returned a JSON string that could not be parsed')
      }
    }

    if (parsed && Array.isArray(parsed.questions)) {
      questionsPayload = parsed.questions
    }

    if (!Array.isArray(questionsPayload)) {
      throw new Error('DEVLAB_GPT_API response is not an array of questions')
    }

    const sanitizedQuestions = questionsPayload
      .map((question, index) => {
        if (typeof question === 'string') {
          return {
            question_id: `q${index + 1}`,
            question
          }
        }

        return {
          question_id: question.question_id || `q${index + 1}`,
          question: question.question || question.prompt || question.description || ''
        }
      })
      .filter((question) => question.question && question.question.trim().length > 0)

    if (!sanitizedQuestions.length) {
      throw new Error('DEVLAB_GPT_API did not return any usable questions')
    }

    return sanitizedQuestions
  }
}

export const competitionAIService = new CompetitionAIService()
