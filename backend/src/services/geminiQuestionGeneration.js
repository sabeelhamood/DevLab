import { geminiService } from './gemini.js'

const toArray = (value) => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

const normalizeTestCase = (rawCase) => {
  if (!rawCase || typeof rawCase !== 'object') {
    return {
      input: '',
      expected: '',
      explanation: ''
    }
  }

  return {
    input:
      rawCase.input ??
      rawCase.inputs ??
      rawCase.example ??
      rawCase.exampleInput ??
      rawCase.example_input ??
      '',
    expected:
      rawCase.expected ??
      rawCase.expectedOutput ??
      rawCase.expected_output ??
      rawCase.output ??
      rawCase.result ??
      '',
    explanation: rawCase.explanation ?? rawCase.reason ?? ''
  }
}

const normalizeQuestion = (question, index, defaults = {}) => {
  if (!question || typeof question !== 'object') {
    return {
      id: `gemini-question-${index + 1}`,
      title: `Question ${index + 1}`,
      description: '',
      difficulty: defaults.difficulty || 'intermediate',
      language: defaults.language || 'javascript',
      timeLimit: defaults.timeLimit || 600,
      points: defaults.basePoints || 100,
      summary: '',
      hints: [],
      solution: '',
      testCases: []
    }
  }

  const hints = toArray(question.hints).filter(Boolean)

  return {
    id: question.id || `gemini-question-${index + 1}`,
    title: question.title || `Question ${index + 1}`,
    description: question.description || question.prompt || '',
    difficulty: question.difficulty || defaults.difficulty || 'intermediate',
    language: question.language || defaults.language || 'javascript',
    summary: question.summary || '',
    hints,
    solution: question.solution || question.answer || '',
    timeLimit: defaults.timeLimit || 600,
    points: defaults.basePoints
      ? defaults.basePoints + index * (defaults.pointsStep || 0)
      : defaults.points || 100,
    testCases: toArray(question.testCases ?? question.test_cases).map(normalizeTestCase)
  }
}

/**
 * Generate a set of competition-ready questions through Gemini.
 * Falls back to the built-in GeminiService fallback when the API is unavailable.
 */
export const generateQuestions = async ({
  topicName = 'JavaScript Competitions',
  difficulty = 'intermediate',
  questionCount = 3,
  language = 'javascript',
  skills = ['arrays', 'objects', 'async', 'problem solving', 'application design'],
  humanLanguage = 'en'
} = {}) => {
  const defaults = {
    difficulty,
    language,
    timeLimit: 600,
    basePoints: 120,
    pointsStep: 20
  }

  let generated
  try {
    // Use only topicName for Gemini API - courseName is no longer used
    const finalTopicName = topicName || 'General Programming'
    generated = await geminiService.generateCodingQuestion(
      finalTopicName,
      Array.isArray(skills) ? skills : [],
      questionCount,
      language,
      { humanLanguage }
    )
  } catch (error) {
    console.error('❌ Failed to generate questions via Gemini, using fallback:', error.message)
    generated = []
  }

  const questionsArray = toArray(generated).slice(0, questionCount)

  if (!questionsArray.length) {
    // ultimate fallback
    return [
      normalizeQuestion(
        {
          title: 'JavaScript Array Transformation',
          description:
            'Write a JavaScript function `transformScores(scores)` that receives an array of numbers and returns a new array where values below 0 become 0, values above 100 become 100, and other values remain unchanged.',
          difficulty: difficulty,
          language,
          testCases: [
            { input: '[ -10, 0, 50, 120 ]', expectedOutput: '[ 0, 0, 50, 100 ]' },
            { input: '[ 15, 85, 95 ]', expectedOutput: '[ 15, 85, 95 ]' }
          ],
          hints: [
            'You can iterate over the array and transform each value.',
            'Math.max and Math.min help clamp values within a range.'
          ],
          summary: 'Normalising numeric data for consistent scoring.'
        },
        0,
        defaults
      )
    ]
  }

  return questionsArray.map((question, index) => normalizeQuestion(question, index, defaults))
}


