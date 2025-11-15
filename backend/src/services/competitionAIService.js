import {
  buildCompetitionQuestionsPrompt,
  buildCompetitionStartPrompt,
  buildCompetitionEvaluationPrompt
} from '../prompts/competitionPrompts.js'
import { getFetch } from '../utils/http.js'

const DEVLAB_MODEL = 'gpt-4.1'

const parseJsonResponse = (raw) => {
  if (typeof raw === 'string') {
    return JSON.parse(raw)
  }
  return raw
}

const normalizeQuestionsArray = (questions = []) =>
  questions
    .map((question, index) => {
      if (typeof question === 'string') {
        return {
          question_id: `q${index + 1}`,
          question
        }
      }

      return {
        question_id: question?.question_id || `q${index + 1}`,
        question: question?.question || question?.prompt || question?.description || ''
      }
    })
    .filter((question) => Boolean(question.question && question.question.trim().length))

const normalizeAnswerArray = (answers = []) =>
  answers
    .map((entry, index) => ({
      question_id: entry?.question_id || `q${index + 1}`,
      answer: entry?.answer || entry?.response || ''
    }))
    .filter((entry) => Boolean(entry.answer && entry.answer.trim().length))

const buildFallbackQuestions = (courseName = 'this course') => [
  {
    question_id: 'q1',
    question: `Explain a core concept from ${courseName} and provide a short code snippet that demonstrates it.`
  },
  {
    question_id: 'q2',
    question: `Solve a mid-level algorithmic challenge related to ${courseName}. Describe your approach and write the solution code.`
  },
  {
    question_id: 'q3',
    question: `Debug or optimize a piece of code that could appear in ${courseName}. Explain what you changed and why.`
  }
]

const fallbackAiAnswer = (courseName = 'this course', questionId) =>
  `Placeholder AI answer for ${questionId} in ${courseName}.`

class CompetitionAIService {
  async #callDevlabGPT(prompt) {
    const apiUrl = process.env.DEVLAB_GPT_API_URL || process.env.DEVLAB_GPT_API
    if (!apiUrl) {
      throw new Error('DEVLAB_GPT_API_URL environment variable is not configured')
    }

    const apiKey = process.env.DEVLAB_GPT_API_KEY || process.env.DEVLAB_GPT_API_TOKEN
    const fetchFn = await getFetch()

    const headers = {
      'Content-Type': 'application/json',
      'x-devlab-gpt-model': DEVLAB_MODEL
    }

    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`
    }

    const response = await fetchFn(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        model: DEVLAB_MODEL
      })
    })

    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(
        `DEVLAB_GPT_API responded with status ${response.status}: ${responseText || 'No response body'}`
      )
    }

    return parseJsonResponse(responseText)
  }

  async generateCompetitionSetup({ courseName }) {
    try {
      const prompt = buildCompetitionQuestionsPrompt(courseName)
      const payload = await this.#callDevlabGPT(prompt)
      const questions = normalizeQuestionsArray(payload?.questions || payload)

      if (questions.length !== 3) {
        throw new Error('DEVLAB_GPT_API must return exactly 3 questions')
      }

      return { questions }
    } catch (error) {
      console.warn('⚠️ Falling back to default competition questions:', error.message)
      return { questions: buildFallbackQuestions(courseName) }
    }
  }

  async generateAIAnswerForQuestion({ courseName, question }) {
    if (!question) {
      throw new Error('Question is required for AI answer generation')
    }

    try {
      const prompt = buildCompetitionStartPrompt({ courseName, question })
      const payload = await this.#callDevlabGPT(prompt)
      const normalized = normalizeAnswerArray(
        Array.isArray(payload?.ai_answers)
          ? payload.ai_answers
          : Array.isArray(payload)
          ? payload
          : [payload]
      )

      if (!normalized.length) {
        throw new Error('DEVLAB_GPT_API did not return an answer for the current question')
      }

      return normalized[0]?.answer || ''
    } catch (error) {
      console.warn('⚠️ Falling back to default AI answer:', error.message)
      return fallbackAiAnswer(courseName, question?.question_id)
    }
  }

  async evaluateCompetition({ questions, aiAnswers, learnerAnswers }) {
    if (!questions?.length || !aiAnswers?.length || !learnerAnswers?.length) {
      throw new Error('Questions, AI answers, and learner answers are required for evaluation')
    }

    try {
      const prompt = buildCompetitionEvaluationPrompt({
        questions,
        aiAnswers,
        learnerAnswers
      })

      const payload = await this.#callDevlabGPT(prompt)
      const winner = payload?.winner
      const score = payload?.score

      if (!winner || (winner !== 'learner' && winner !== 'ai')) {
        throw new Error('DEVLAB_GPT_API evaluation did not return a valid winner')
      }

      const numericScore =
        typeof score === 'number'
          ? Math.max(0, Math.min(100, Math.round(score)))
          : 0

      return {
        winner,
        score: numericScore
      }
    } catch (error) {
      console.warn('⚠️ Falling back to default evaluation:', error.message)
      return {
        winner: 'ai',
        score: 0
      }
    }
  }
}

export const competitionAIService = new CompetitionAIService()
