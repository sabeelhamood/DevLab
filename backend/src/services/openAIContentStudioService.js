import { getFetch } from '../utils/http.js'
import {
  buildGenerateCodingQuestionsPrompt,
  buildEvaluationPrompt,
  buildHintPrompt,
  buildFraudDetectionPrompt,
  buildEnhancedFraudPatternPrompt,
  buildLearningRecommendationsPrompt,
  buildRevealSolutionPrompt
} from '../prompts/openAIContentStudioPrompts.js'
import {
  buildCodingExerciseValidationPrompt,
  buildTrainerExerciseTransformationPrompt
} from '../prompts/openAIContentStudioValidationPrompts.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const parseJsonResponse = (raw) => {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/```json?|\```/gi, '').trim()
      : trimmed
    try {
      return JSON.parse(withoutFence)
    } catch {
      return withoutFence
    }
  }
  return raw
}

class OpenAIContentStudioService {
  constructor() {
    this.isMockMode = false
    this.isAvailable = true
  }

  async #callOpenAI(prompt, { systemMessage } = {}) {
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
            content:
              systemMessage ||
              'You are an AI assistant for generating and evaluating coding questions. Always follow the JSON formats given in the prompt.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5
      })
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      const msg =
        body?.error?.message ||
        JSON.stringify(body || {}) ||
        'No response body'
      throw new Error(`OpenAI API responded with status ${response.status}: ${msg}`)
    }

    const content = body?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenAI API returned an empty response')
    }

    return content
  }

  /**
   * Core generator for Content Studio style coding questions.
   * Mirrors the original GeminiService.generateCodingQuestion signature.
   */
  async generateContentStudioCodingQuestions(
    topic,
    skills = [],
    amount = 4,
    language = 'javascript',
    options = {}
  ) {
    const { humanLanguage = 'en' } = options || {}

    const prompt = buildGenerateCodingQuestionsPrompt({
      topic,
      skills,
      language,
      humanLanguage,
      amount
    })

    const ensureThreeHints = (hints) => {
      const prepared = Array.isArray(hints) ? hints.filter(Boolean) : []
      while (prepared.length < 3) {
        prepared.push(
          prepared.length === 0
            ? 'Break the problem into smaller helper functions.'
            : prepared.length === 1
              ? 'Consider edge cases, invalid inputs, and performance constraints.'
              : 'Validate the solution using the provided test cases before returning.'
        )
      }
      return prepared.slice(0, 3)
    }

    const ensureTestCases = (testCases) => {
      if (Array.isArray(testCases) && testCases.length >= 3) {
        return testCases
      }
      return [
        {
          input: 'sampleInput(2, 3)',
          expected_output: '5',
          explanation: 'Demonstrates a standard case with positive values'
        },
        {
          input: 'sampleInput(-1, 5)',
          expected_output: '4',
          explanation: 'Shows handling of negative numbers'
        },
        {
          input: 'sampleInput(0, 0)',
          expected_output: '0',
          explanation: 'Confirms neutral/edge behavior'
        }
      ]
    }

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)

      const questionsArray = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []

      return questionsArray
        .filter(Boolean)
        .slice(0, amount)
        .map((q, index) => {
          const testCasesRaw = q.testCases || q.test_cases || []
          const normalizedTestCases = ensureTestCases(
            testCasesRaw.map((tc) => ({
              input: tc.input ?? '',
              expected_output: tc.expectedOutput ?? tc.expected_output ?? tc.output ?? '',
              explanation: tc.explanation ?? ''
            }))
          )

          const normalizedHints = ensureThreeHints(q.hints || [])

          return {
            title: q.title || `Coding Question ${index + 1}`,
            description: q.description || q.question || '',
            difficulty: q.difficulty || 'intermediate',
            language: q.language || language,
            testCases: normalizedTestCases,
            hints: normalizedHints,
            expectsReturn: typeof q.expectsReturn === 'boolean' ? q.expectsReturn : true
          }
        })
    } catch (error) {
      console.error('[OpenAIContentStudio] generateContentStudioCodingQuestions error:', error)
      // Ultimate fallback: single very generic question
      return [
        {
          title: `Practice Coding Challenge`,
          description: `Write a ${language} function related to ${topic}.`,
          difficulty: 'intermediate',
          language,
          testCases: ensureTestCases([]),
          hints: ensureThreeHints([]),
          expectsReturn: true
        }
      ]
    }
  }

  // Backwards-compatible wrapper for existing Gemini-style calls
  async generateCodingQuestion(topic, skills, amount, language, options) {
    return this.generateContentStudioCodingQuestions(topic, skills, amount, language, options)
  }

  async evaluateSolution(code, question, language = 'javascript', testCases = []) {
    const prompt = buildEvaluationPrompt({ question, code, language, testCases })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)
      if (typeof parsed === 'object') {
        return parsed
      }
      // If parsing failed into object, return a minimal wrapper
      return {
        isCorrect: false,
        score: 0,
        feedback: String(parsed),
        suggestions: [],
        testResults: [],
        codeQuality: {},
        specificErrors: [],
        improvements: [],
        optimizedVersion: null,
        summary: 'Unable to parse structured evaluation from OpenAI.'
      }
    } catch (error) {
      console.error('[OpenAIContentStudio] evaluateSolution error:', error)
      return {
        isCorrect: false,
        score: 0,
        feedback: 'Evaluation service is temporarily unavailable.',
        suggestions: ['Re-check your logic manually', 'Try additional test cases'],
        testResults: [],
        codeQuality: {},
        specificErrors: [],
        improvements: [],
        optimizedVersion: null,
        summary: 'Fallback evaluation used because OpenAI was unavailable.',
        fallback: true
      }
    }
  }

  async evaluateCodeSubmission(code, question, language = 'javascript', testCases = []) {
    return this.evaluateSolution(code, question, language, testCases)
  }

  async generateHints(question, userAttempt, hintsUsed = 0, allHints = []) {
    const prompt = buildHintPrompt({ question, userAttempt, hintsUsed, allHints })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)

      if (parsed && (parsed.hint || parsed.text || parsed.message)) {
        return parsed
      }

      return this.generateFallbackHints(question, userAttempt, hintsUsed)
    } catch (error) {
      console.error('[OpenAIContentStudio] generateHints error:', error)
      return this.generateFallbackHints(question, userAttempt, hintsUsed)
    }
  }

  generateFallbackHints(question, userAttempt, hintsUsed = 0) {
    const fallbackHints = [
      'Try breaking down the problem into smaller steps.',
      'Consider what data structures might be helpful for this problem.',
      'Think about edge cases and how to handle them.',
      'Look at the test cases to understand the expected behavior.',
      'Consider using helper functions to organize your code better.'
    ]

    const safeHintsUsed = Math.max(0, Math.min(Number(hintsUsed) || 0, fallbackHints.length - 1))
    const hintIndex = safeHintsUsed
    const hint = fallbackHints[hintIndex] || fallbackHints[0]

    const hintText =
      typeof hint === 'string'
        ? hint
        : hint.hint || hint.text || hint.message || fallbackHints[0]

    return {
      hint: hintText,
      hintLevel: safeHintsUsed + 1,
      showSolution: false,
      solution: null,
      canShowSolution: safeHintsUsed >= 2,
      fallback: true,
      message: 'Using fallback hint due to service unavailability'
    }
  }

  async showSolution({ language = 'javascript', skills = [], humanLanguage = 'en', question }) {
    const prompt = buildRevealSolutionPrompt({ language, skills, humanLanguage, question })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)

      let solution = ''
      if (typeof parsed === 'string') {
        solution = parsed
      } else if (parsed && typeof parsed === 'object') {
        solution =
          parsed.solution ||
          parsed.code ||
          parsed.answer ||
          parsed.text ||
          ''
      }

      if (!solution || typeof solution !== 'string') {
        return {
          solution: '',
          fallback: true,
          message: 'OpenAI did not return a usable solution payload.'
        }
      }

      return { solution }
    } catch (error) {
      console.error('[OpenAIContentStudio] showSolution error:', error)
      return {
        solution: '',
        fallback: true,
        message: 'Solution generation service is temporarily unavailable.'
      }
    }
  }

  async detectFraud(code, question) {
    const prompt = buildFraudDetectionPrompt({ code, question })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
      return {
        aiLikelihood: 0,
        humanLikelihood: 100,
        explanation: String(parsed),
        verdict: 'Unclear'
      }
    } catch (error) {
      console.error('[OpenAIContentStudio] detectFraud error:', error)
      return {
        aiLikelihood: 0,
        humanLikelihood: 100,
        explanation: 'Fraud detection service unavailable. Assuming human-written code.',
        verdict: 'Unclear',
        fallback: true
      }
    }
  }

  async detectCheating(code, question) {
    return this.detectFraud(code, question)
  }

  async enhancedAiDetection(code, question, language = 'javascript') {
    const prompt = buildEnhancedFraudPatternPrompt({ code, question, language })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
      return {
        isAiGenerated: false,
        confidence: 0,
        detectedPatterns: [],
        reasons: [],
        analysis: String(parsed),
        summary: 'Unable to parse enhanced AI detection response.'
      }
    } catch (error) {
      console.error('[OpenAIContentStudio] enhancedAiDetection error:', error)
      return {
        isAiGenerated: false,
        confidence: 0,
        detectedPatterns: [],
        reasons: [],
        analysis: 'Enhanced AI detection service unavailable.',
        summary: 'Fallback: could not perform enhanced AI detection.'
      }
    }
  }

  simpleAiDetection(code, language = 'javascript') {
    const patterns = {
      aiVariableNames: /\b(item|element|result|data|value|temp|current|total|subtotal|finalTotal|discountPercentage|discountThreshold)\b/g,
      perfectComments: /\/\/\s*(Calculate|Initialize|Check|Apply|Return|Handle|Process|Validate)/g,
      genericFunctions: /\b(calculate|process|handle|validate|check|apply|initialize|compute)\w*/g,
      perfectFormatting: /^\s*\/\/\s*[A-Z][a-z]+.*\.$/gm,
      professionalStructure: /\{\s*\n\s*\/\/\s*[A-Z]/g
    }

    let score = 0
    const detectedPatterns = []

    const aiVariableMatches = code.match(patterns.aiVariableNames)
    if (aiVariableMatches && aiVariableMatches.length > 3) {
      score += 20
      detectedPatterns.push(`Generic AI variable names: ${aiVariableMatches.slice(0, 3).join(', ')}`)
    }

    const perfectCommentMatches = code.match(patterns.perfectComments)
    if (perfectCommentMatches && perfectCommentMatches.length > 2) {
      score += 15
      detectedPatterns.push(`Overly perfect comments: ${perfectCommentMatches.length} instances`)
    }

    const genericFunctionMatches = code.match(patterns.genericFunctions)
    if (genericFunctionMatches && genericFunctionMatches.length > 2) {
      score += 15
      detectedPatterns.push(`Generic function names: ${genericFunctionMatches.slice(0, 2).join(', ')}`)
    }

    const perfectFormattingMatches = code.match(patterns.perfectFormatting)
    if (perfectFormattingMatches && perfectFormattingMatches.length > 1) {
      score += 10
      detectedPatterns.push(`Perfect comment formatting: ${perfectFormattingMatches.length} instances`)
    }

    const professionalStructureMatches = code.match(patterns.professionalStructure)
    if (professionalStructureMatches && professionalStructureMatches.length > 0) {
      score += 10
      detectedPatterns.push('Professional code structure detected')
    }

    try {
      if (language === 'javascript') {
        // eslint-disable-next-line no-new-func
        new Function(code)
        score += 5
        detectedPatterns.push('Perfect syntax with no errors')
      }
    } catch {
      // Syntax errors are common in student code; do not add score
    }

    const isAiGenerated = score >= 30
    const confidence = Math.min(score, 95)

    return {
      isAiGenerated,
      confidence,
      detectedPatterns,
      reasons: detectedPatterns,
      analysis: `Pattern-based analysis detected ${score} points of AI characteristics`,
      summary: isAiGenerated
        ? 'AI-generated code detected by pattern analysis'
        : 'No clear AI patterns detected'
    }
  }

  async generateLearningRecommendations(userProfile, performanceData) {
    const prompt = buildLearningRecommendationsPrompt({ userProfile, performanceData })

    try {
      const raw = await this.#callOpenAI(prompt)
      const parsed = parseJsonResponse(raw)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
      return {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        nextSteps: [],
        encouragement: String(parsed),
        suggestedResources: [],
        learningPath: '',
        summary: 'Unable to parse learning recommendations response.'
      }
    } catch (error) {
      console.error('[OpenAIContentStudio] generateLearningRecommendations error:', error)
      throw new Error(`Failed to generate learning recommendations: ${error.message}`)
    }
  }

  async validateCodingQuestionOpenAI({
    topic_name,
    question_type,
    programming_language,
    skills = [],
    humanLanguage = 'en',
    exercises = []
  }) {
    const prompt = buildCodingExerciseValidationPrompt({
      topicName: topic_name,
      questionType: question_type,
      programmingLanguage: programming_language,
      skills,
      humanLanguage,
      exercises
    })

    const raw = await this.#callOpenAI(prompt, {
      systemMessage:
        'You are a strict validator for coding exercises. Respond only with TRUE or FALSE: <reason>.'
    })

    return typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim()
  }

  async transformTrainerExercisesOpenAI({
    topic_name,
    topic_id,
    programming_language,
    skills = [],
    humanLanguage = 'en',
    exercises = []
  }) {
    const prompt = buildTrainerExerciseTransformationPrompt({
      topicName: topic_name,
      topicId: topic_id,
      programmingLanguage: programming_language,
      skills,
      humanLanguage,
      exercises
    })

    const raw = await this.#callOpenAI(prompt, {
      systemMessage:
        'You convert trainer exercises into structured coding questions. Output a pure JSON array.'
    })

    const parsed = parseJsonResponse(raw)

    if (!Array.isArray(parsed)) {
      throw new Error('OpenAI did not return a JSON array for transformed exercises')
    }

    return parsed
  }
}

export const openAIContentStudioService = new OpenAIContentStudioService()


