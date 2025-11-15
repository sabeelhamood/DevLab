import { postgres } from '../config/database.js'

const competitionsVsAiTable = postgres.quoteIdentifier('competitions_vs_ai')

const parseJsonField = (value) => {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

const extractAnswersFromQuestions = (questions = [], key = 'ai') =>
  questions
    .map((question) => {
      const state = question?.state || {}
      const answerValue = key === 'ai' ? state.ai_answer : state.learner_answer
      if (!answerValue || !question?.question_id) {
        return null
      }
      return {
        question_id: question.question_id,
        answer: answerValue
      }
    })
    .filter(Boolean)

const mapCompetitionRow = (row) => {
  if (!row) {
    return null
  }

  return {
    ...row,
    questions: parseJsonField(row.questions),
    ai_answers: parseJsonField(row.ai_answers),
    learner_answers: parseJsonField(row.learner_answers),
    in_progress_answers: parseJsonField(row.in_progress_answers)
  }
}

const stringifyJson = (value) => JSON.stringify(value ?? [])

const upsertAnswer = (answers = [], nextAnswer = {}) => {
  if (!nextAnswer?.question_id) {
    return answers
  }

  const existingIndex = answers.findIndex(
    (entry) => entry.question_id === nextAnswer.question_id
  )

  if (existingIndex >= 0) {
    const clone = [...answers]
    clone[existingIndex] = nextAnswer
    return clone
  }

  return [...answers, nextAnswer]
}

export class CompetitionAIModel {
  static async create({ learnerId, learnerName, courseId, courseName, questions }) {
    const questionsPayload = Array.isArray(questions) ? questions : []

    const { rows } = await postgres.query(
      `
        INSERT INTO ${competitionsVsAiTable} (
          "competition_id",
          "learner_id",
          "learner_name",
          "course_id",
          "course_name",
          "questions",
          "learner_answers",
          "in_progress_answers",
          "status",
          "timer_seconds",
          "current_question_index",
          "winner",
          "score",
          "created_at",
          "updated_at"
        )
        VALUES (
          gen_random_uuid(),
          $1::uuid,
          $2::text,
          $3::text,
          $4::text,
          $5::jsonb,
          '[]'::jsonb,
          '[]'::jsonb,
          'pending',
          1800,
          0,
          NULL,
          NULL,
          now(),
          now()
        )
        RETURNING *
      `,
      [
        learnerId,
        learnerName || null,
        String(courseId),
        courseName || null,
        stringifyJson(questionsPayload)
      ]
    )

    return mapCompetitionRow(rows[0])
  }

  static async findByLearnerAndCourse(learnerId, courseId) {
    const { rows } = await postgres.query(
      `
        SELECT *
        FROM ${competitionsVsAiTable}
        WHERE "learner_id" = $1::uuid
          AND "course_id" = $2::text
        ORDER BY "created_at" DESC
        LIMIT 1
      `,
      [learnerId, String(courseId)]
    )

    return mapCompetitionRow(rows[0])
  }

  static async getPendingCourses(learnerId) {
    const { rows } = await postgres.query(
      `
        SELECT 
          cc."course_id"::text AS course_id,
          cc."course_name",
          cc."completed_at"
        FROM "course_completions" cc
        LEFT JOIN ${competitionsVsAiTable} cva
          ON cva."learner_id" = cc."learner_id"
         AND cva."course_id" = cc."course_id"::text
        WHERE cc."learner_id" = $1::uuid
          AND cva."competition_id" IS NULL
        ORDER BY cc."completed_at" DESC
      `,
      [learnerId]
    )

    return rows || []
  }

  static async findById(competitionId) {
    const { rows } = await postgres.query(
      `
        SELECT *
        FROM ${competitionsVsAiTable}
        WHERE "competition_id" = $1::uuid
        LIMIT 1
      `,
      [competitionId]
    )

    return mapCompetitionRow(rows[0])
  }

  static async updateById(competitionId, fields = {}) {
    if (!competitionId) {
      throw new Error('competitionId is required for update')
    }

    const updates = []
    const values = []
    let index = 1

    for (const [key, value] of Object.entries(fields)) {
      if (['questions', 'ai_answers', 'learner_answers', 'in_progress_answers'].includes(key)) {
        updates.push(`"${key}" = $${index}::jsonb`)
        values.push(stringifyJson(value))
      } else {
        updates.push(`"${key}" = $${index}`)
        values.push(value)
      }
      index += 1
    }

    updates.push(`"updated_at" = now()`)

    const { rows } = await postgres.query(
      `
        UPDATE ${competitionsVsAiTable}
        SET ${updates.join(', ')}
        WHERE "competition_id" = $${index}::uuid
        RETURNING *
      `,
      [...values, competitionId]
    )

    return mapCompetitionRow(rows[0])
  }

  static async appendInProgressAnswer(competitionId, answer) {
    const competition = await this.findById(competitionId)

    if (!competition) {
      return null
    }

    const updatedAnswers = upsertAnswer(competition.in_progress_answers, {
      question_id: answer.question_id,
      answer: answer.answer,
      submitted_at: answer.submitted_at || new Date().toISOString()
    })

    return this.updateById(competitionId, {
      in_progress_answers: updatedAnswers
    })
  }

  static async finalizeCompetition(competitionId, { learnerAnswers, aiAnswers, winner = null, score = null }) {
    return this.updateById(competitionId, {
      learner_answers: learnerAnswers,
      ai_answers: aiAnswers,
      in_progress_answers: [],
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner,
      score
    })
  }

  static async saveEvaluation(competitionId, { winner, score }) {
    if (!competitionId) {
      throw new Error('competitionId is required for evaluation save')
    }

    const payload = {}

    if (winner) {
      payload.winner = winner
    }

    if (typeof score === 'number') {
      payload.score = Math.max(0, Math.min(100, Math.round(score)))
    }

    if (!Object.keys(payload).length) {
      return this.findById(competitionId)
    }

    return this.updateById(competitionId, payload)
  }
}
