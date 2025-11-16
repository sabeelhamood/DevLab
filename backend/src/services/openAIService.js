import { getFetch } from '../utils/http.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4'

const parseJsonResponse = (raw) => {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    // Remove markdown code fences if present
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/```json?|\```/gi, '').trim()
      : trimmed
    try {
      return JSON.parse(withoutFence)
    } catch (e) {
      // If parsing fails, return the raw string
      return { description: withoutFence }
    }
  }
  return raw
}

class OpenAIService {
  async #callOpenAI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured')
    }

    const fetchFn = await getFetch()

    const response = await fetchFn(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an examiner generating coding assessment questions. Respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })
    })

    const responseBody = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        responseBody?.error?.message ||
        JSON.stringify(responseBody || {}) ||
        'No response body'
      throw new Error(`OpenAI API responded with status ${response.status}: ${message}`)
    }

    const content = responseBody?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI API returned an empty response')
    }

    return content
  }

  async generateAssessmentCoding(amount, difficulty, humanLanguage, skills, programming_language) {
    if (!amount || amount <= 0) {
      throw new Error('Amount must be a positive number')
    }

    if (!programming_language) {
      throw new Error('Programming language is required')
    }

    const skillsText = Array.isArray(skills) && skills.length > 0
      ? `The question should be based on the following skills: ${skills.join(', ')}.`
      : ''

    const difficultyLevel = difficulty || 'medium'
    const humanLangText = humanLanguage ? (humanLanguage === 'en' ? 'English' : humanLanguage) : 'English'
    const questionPlural = amount > 1 ? 's' : ''
    const mustText = amount > 1 ? 's must' : ' must'
    
    const prompt = 'You are now an examiner generating a coding assessment question.\n\n' +
      `Generate ${amount} coding question${questionPlural} in ${programming_language}.\n\n` +
      (skillsText ? skillsText + '\n\n' : '') +
      `The difficulty level should be: ${difficultyLevel}.\n\n` +
      'Requirements:\n' +
      `- The question${mustText} be clear, well-structured, and without hints.\n` +
      '- Do not reveal the solution.\n' +
      '- Each question should include:\n' +
      '  - A clear description of the problem\n' +
      '  - Test cases with input and expected output\n' +
      '  - Appropriate difficulty level\n\n' +
      `The question should be written in ${humanLangText}.\n\n` +
      'Return the result as a JSON array of questions. Each question should have this structure:\n' +
      '{\n' +
      '  "title": "Question title",\n' +
      '  "description": "Detailed question description",\n' +
      `  "difficulty": "${difficultyLevel}",\n` +
      '  "testCases": [\n' +
      '    {\n' +
      '      "input": "input example",\n' +
      '      "expected_output": "expected output"\n' +
      '    }\n' +
      '  ],\n' +
      `  "language": "${programming_language}"\n` +
      '}\n\n' +
      'Return only the JSON array, no additional text.'

    try {
      const rawResponse = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(rawResponse)

      // Handle both array and single object responses
      let questions = Array.isArray(parsed) ? parsed : [parsed]

      // Ensure each question has required fields
      questions = questions.map((q, index) => ({
        title: q.title || `Coding Question ${index + 1}`,
        description: q.description || q.question || '',
        difficulty: q.difficulty || difficulty || 'medium',
        testCases: Array.isArray(q.testCases) && q.testCases.length > 0
          ? q.testCases
          : [
              {
                input: 'sampleInput()',
                expected_output: 'expected output'
              }
            ],
        language: q.language || programming_language,
        skills: Array.isArray(skills) ? skills : []
      }))

      // Limit to requested amount
      return questions.slice(0, amount)
    } catch (error) {
      console.error('OpenAI generateAssessmentCoding error:', error)
      throw new Error(`Failed to generate coding questions: ${error.message}`)
    }
  }
}

export const openAIService = new OpenAIService()

