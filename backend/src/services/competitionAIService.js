import {
  buildCompetitionQuestionsPrompt,
  buildCompetitionStartPrompt,
  buildCompetitionEvaluationPrompt
} from '../prompts/competitionPrompts.js'
import { getFetch } from '../utils/http.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-3.5-turbo'

const parseJsonResponse = (raw) => {
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    const withoutFence = trimmed.startsWith('```')
      ? trimmed.replace(/```json?|\```/gi, '').trim()
      : trimmed
    return JSON.parse(withoutFence)
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

class CompetitionAIService {
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
            content: 'You are an assistant that responds strictly with valid JSON.'
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

    return parseJsonResponse(content)
  }

  async generateCompetitionSetup({ courseName }) {
    const prompt = buildCompetitionQuestionsPrompt(courseName)
    const payload = await this.#callOpenAI(prompt)
    const questions = normalizeQuestionsArray(payload?.questions || payload)

    if (questions.length !== 3) {
      throw new Error('OpenAI API must return exactly 3 questions')
    }

    return { questions }
  }

  async generateAIAnswerForQuestion({ courseName, question }) {
    if (!question) {
      throw new Error('Question is required for AI answer generation')
    }

    const prompt = buildCompetitionStartPrompt({ courseName, question })
    const payload = await this.#callOpenAI(prompt)
    const normalized = normalizeAnswerArray(
      Array.isArray(payload?.ai_answers)
        ? payload.ai_answers
        : Array.isArray(payload)
        ? payload
        : [payload]
    )

    if (!normalized.length) {
      throw new Error('OpenAI API did not return an answer for the current question')
    }

    return normalized[0]?.answer || ''
  }

  async evaluateCompetition({ questions, aiAnswers, learnerAnswers }) {
    if (!questions?.length || !aiAnswers?.length || !learnerAnswers?.length) {
      throw new Error('Questions, AI answers, and learner answers are required for evaluation')
    }

    const prompt = buildCompetitionEvaluationPrompt({
      questions,
      aiAnswers,
      learnerAnswers
    })

    const payload = await this.#callOpenAI(prompt)
    const winner = payload?.winner
    const score = payload?.score

    if (!winner || (winner !== 'learner' && winner !== 'ai')) {
      throw new Error('OpenAI API evaluation did not return a valid winner')
    }

    const numericScore =
      typeof score === 'number'
        ? Math.max(0, Math.min(100, Math.round(score)))
        : 0

    return {
      winner,
      score: numericScore
    }
  }
}

export const competitionAIService = new CompetitionAIService()
