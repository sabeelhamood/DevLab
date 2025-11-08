// Frontend Gemini API service
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://devlab-backend-production-0bcb.up.railway.app/api' : 'http://localhost:3001/api')

class GeminiAPI {
  async generateHint(question, userAttempt, hintsUsed = 0, allHints = []) {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini/generate-hint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userAttempt,
          hintsUsed,
          allHints
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.hint
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to generate hint: ${error.message}`)
    }
  }

  async generateQuestion(topic, difficulty, language = 'javascript') {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
          language
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.question
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to generate question: ${error.message}`)
    }
  }

  async evaluateCode(code, question, language = 'javascript') {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini/evaluate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          question,
          language
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.evaluation
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to evaluate code: ${error.message}`)
    }
  }

  async detectCheating(code, question) {
    try {
      const response = await fetch(`${API_BASE_URL}/gemini/detect-cheating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          question
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.analysis
    } catch (error) {
      console.error('Gemini API error:', error)
      throw new Error(`Failed to detect cheating: ${error.message}`)
    }
  }
}

export const geminiAPI = new GeminiAPI()
export default geminiAPI

