import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildPagination,
  buildUpdateStatement,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const competitionTableName = tables.competitions
const competitionsTable = postgres.quoteIdentifier(competitionTableName)
const usersTable = postgres.quoteIdentifier(tables.userProfiles)
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions)

const loadCompetitionRelations = async (competitions = []) => {
  if (!competitions.length) {
    return []
  }

  const learnerIds = [
    ...new Set(
      competitions
        .flatMap((competition) => [competition.learner1_id, competition.learner2_id])
        .filter(Boolean)
    )
  ]

  let learnersMap = {}
  if (learnerIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${usersTable} WHERE "learner_id" = ANY($1::uuid[])`,
      [learnerIds]
    )

    learnersMap = rows.reduce((acc, learner) => {
      acc[learner.learner_id] = learner
      return acc
    }, {})
  }

  return competitions.map((competition) => {
    const learner1Answers = Array.isArray(competition.learner1_answers)
      ? competition.learner1_answers
      : []
    const learner2Answers = Array.isArray(competition.learner2_answers)
      ? competition.learner2_answers
      : []

    const currentQuestion = Math.max(learner1Answers.length, learner2Answers.length)

    return {
      ...competition,
      learner1_answers: learner1Answers,
      learner2_answers: learner2Answers,
      current_question: currentQuestion,
      course:
        competition.course_id || competition.course_name
          ? {
              course_id: competition.course_id,
              course_name: competition.course_name || null
            }
          : null,
      learner1: competition.learner1_id ? learnersMap[competition.learner1_id] || null : null,
      learner2: competition.learner2_id ? learnersMap[competition.learner2_id] || null : null
    }
  })
}

const defaultRelations = {
  includeCourse: true,
  includeLearners: true
}

const jsonColumns = [
  'questions',
  'learner1_answers',
  'learner2_answers',
  'result',
  'performance_learner1',
  'performance_learner2'
]

const DEFAULT_TURN_TIMER = 600

const normalizeLearnerTurnState = (state = {}) => ({
  submitted: Boolean(state.submitted),
  score: Number(state.score ?? state.points ?? 0),
  time_spent: Number(state.time_spent ?? state.timeSpent ?? 0),
  submitted_at: state.submitted_at || null
})

const ensureQuestionTurnState = (question = {}, index = 0) => {
  if (!question.state || typeof question.state !== 'object') {
    question.state = {}
  }

  const state = question.state
  state.index = index
  state.learner1 = normalizeLearnerTurnState(state.learner1)
  state.learner2 = normalizeLearnerTurnState(state.learner2)

  if (state.timer === undefined || state.timer === null) {
    state.timer = question.timeLimit || DEFAULT_TURN_TIMER
  }

  if (state.is_active === undefined) {
    state.is_active = index === 0
  }

  if (state.completed === undefined) {
    state.completed = false
  }

  return state
}

const normalizeCompetitionInsertPayload = (data = {}) => {
  const payload = { ...data }

  for (const column of jsonColumns) {
    if (payload[column] !== undefined && payload[column] !== null) {
      if (typeof payload[column] !== 'string') {
        payload[column] = JSON.stringify(payload[column])
      }
    }
  }

  return payload
}

const ensureCourseCompletion = async (client, learnerId, courseId, courseName) => {
  if (!learnerId || !courseId) {
    return
  }

  const { rows } = await client.query(
    `
    SELECT 1
    FROM ${courseCompletionsTable}
    WHERE "learner_id" = $1
      AND "course_id" = $2
    LIMIT 1
    `,
    [learnerId, courseId]
  )

  if (rows.length) {
    return
  }

  await client.query(
    `
    INSERT INTO ${courseCompletionsTable} (
      "learner_id",
      "course_id",
      "course_name"
    )
    VALUES ($1, $2, $3)
    `,
    [learnerId, courseId, courseName ?? null]
  )
}

export class CompetitionModel {
  static async create(rawCompetitionData) {
    const client = await postgres.getClient()

    try {
      await client.query('BEGIN')

      const competitionData = normalizeCompetitionInsertPayload(rawCompetitionData)
      const query = buildInsertStatement(competitionsTable, competitionData)
      const { rows } = await client.query(query.text, query.values)

      const competitionRow = rows[0]

      if (competitionRow?.course_id) {
        await Promise.all([
          ensureCourseCompletion(
            client,
            competitionRow.learner1_id,
            competitionRow.course_id,
            competitionRow.course_name
          ),
          ensureCourseCompletion(
            client,
            competitionRow.learner2_id,
            competitionRow.course_id,
            competitionRow.course_name
          )
        ])
      }

      await client.query('COMMIT')

      const [competition] = await loadCompetitionRelations([competitionRow], defaultRelations)
      return competition
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  static async findById(competitionId) {
    console.log('🔍 [CompetitionModel] findById called with:', competitionId)
    console.log('🔍 [CompetitionModel] Table name:', competitionsTable)
    
    const { rows } = await postgres.query(
      `SELECT * FROM ${competitionsTable} WHERE "competition_id" = $1 LIMIT 1`,
      [competitionId]
    )

    console.log('🔍 [CompetitionModel] Query returned', rows.length, 'rows')
    if (rows.length > 0) {
      console.log('🔍 [CompetitionModel] First row competition_id:', rows[0].competition_id)
    }

    if (!rows.length) {
      // Try to see if there are any competitions at all
      const { rows: allRows } = await postgres.query(
        `SELECT "competition_id" FROM ${competitionsTable} LIMIT 5`
      )
      console.log('🔍 [CompetitionModel] Sample competition IDs in DB:', allRows.map(r => r.competition_id))
      return null
    }

    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
    return competition || null
  }

  static async findAll(page = 1, limit = 10) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `
        SELECT *
        FROM ${competitionsTable}
        ORDER BY "created_at" DESC
        LIMIT $1
        OFFSET $2
        `,
        [pageLimit, offset]
      ),
      runCountQuery(competitionsTable)
    ])

    const data = await loadCompetitionRelations(rows, defaultRelations)
    return { data, count }
  }

  static async findByCourse(courseId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${competitionsTable}
      WHERE "course_id" = $1
      ORDER BY "created_at" DESC
      `,
      [courseId]
    )

    const competitions = await loadCompetitionRelations(rows, defaultRelations)
    return competitions
  }

  static async findByLearner(learnerId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${competitionsTable}
      WHERE "learner1_id" = $1 OR "learner2_id" = $1
      ORDER BY "created_at" DESC
      `,
      [learnerId]
    )

    const competitions = await loadCompetitionRelations(rows, defaultRelations)
    return competitions
  }

  static async updateResult(competitionId, result) {
    const existing = await postgres.query(
      `
      SELECT "result"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    const existingResult = existing.rows?.[0]?.result || {}

    const mergedResult = {
      ...existingResult,
      ...result,
      per_question: {
        ...(existingResult.per_question || {}),
        ...(result?.per_question || {})
      }
    }

    const winnerId =
      mergedResult?.winner?.user_id ?? mergedResult?.winner_id ?? existingResult?.winner_id ?? null
    const learner1Score =
      mergedResult?.results?.learner1?.score ??
      mergedResult?.learner1_score ??
      mergedResult?.performance_learner1?.score ??
      existingResult?.learner1_score ??
      null
    const learner2Score =
      mergedResult?.results?.learner2?.score ??
      mergedResult?.learner2_score ??
      mergedResult?.performance_learner2?.score ??
      existingResult?.learner2_score ??
      null
    const updatePayload = {
      result: mergedResult,
      winner_id: winnerId,
      learner1_score: learner1Score,
      learner2_score: learner2Score,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      competitionsTable,
      updatePayload,
      `WHERE "competition_id" = $${Object.keys(updatePayload).length + 1}`,
      [competitionId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
    return competition || null
  }

  static async delete(_competitionId) {
    throw new Error('Competition deletion is disabled to preserve historical analytics data.')
  }

  static async getActive() {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${competitionsTable}
      WHERE "result" IS NULL
      ORDER BY "created_at" DESC
      `
    )

    const competitions = await loadCompetitionRelations(rows, defaultRelations)
    return competitions
  }

  static async getCompleted() {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${competitionsTable}
      WHERE "result" IS NOT NULL
      ORDER BY "created_at" DESC
      `
    )

    const competitions = await loadCompetitionRelations(rows, defaultRelations)
    return competitions
  }

  static async findEligibleLearners(courseId, excludeLearnerId) {
    try {
      const { rows } = await postgres.query(
        `
        SELECT "learner_id", "completed_at"
        FROM ${courseCompletionsTable}
        WHERE "course_id" = $1 AND "learner_id" <> $2
        ORDER BY "completed_at" DESC
        LIMIT 10
        `,
        [courseId, excludeLearnerId]
      )

      return rows.map((row) => ({
        id: row.learner_id,
        completedAt: row.completed_at
      }))
    } catch (error) {
      return [
        { id: 'learner-1', completedAt: new Date().toISOString() },
        { id: 'learner-2', completedAt: new Date().toISOString() },
        { id: 'learner-3', completedAt: new Date().toISOString() }
      ]
    }
  }

  static async updateAnswer(competitionId, learnerId, questionId, answerData) {
    const { rows } = await postgres.query(
      `
      SELECT
        "learner1_id",
        "learner2_id",
        "learner1_answers",
        "learner2_answers",
        "questions",
        "questions_answered"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    if (!rows.length) {
      return null
    }

    const competitionRow = rows[0]

    const learnerKey =
      learnerId && competitionRow.learner1_id === learnerId
        ? 'learner1'
        : competitionRow.learner2_id === learnerId
        ? 'learner2'
        : null

    if (!learnerKey) {
      throw new Error('Unable to map learner to competition participants.')
    }

    const answersKey = `${learnerKey}_answers`
    const existingAnswers = Array.isArray(competitionRow[answersKey])
      ? [...competitionRow[answersKey]]
      : []

    const enrichedAnswer = {
      questionId,
      ...answerData
    }

    const existingIndex = existingAnswers.findIndex(
      (entry) => entry.questionId === questionId
    )

    if (existingIndex >= 0) {
      existingAnswers[existingIndex] = enrichedAnswer
    } else {
      existingAnswers.push(enrichedAnswer)
    }

    const questions = Array.isArray(competitionRow.questions)
      ? competitionRow.questions.map((question) => ({ ...question }))
      : []

    const questionIndex = questions.findIndex(
      (question) => question.id === questionId || question.question_id === questionId
    )

    if (questionIndex >= 0) {
      const question = questions[questionIndex]
      const state = ensureQuestionTurnState(question, questionIndex)
      const learnerState = normalizeLearnerTurnState({
        submitted: true,
        score: answerData.score ?? 0,
        time_spent: answerData.timeSpent ?? 0,
        submitted_at: new Date().toISOString()
      })

      state[learnerKey] = learnerState
      state.last_updated = new Date().toISOString()
      state.is_active = state.is_active ?? questionIndex === 0
    }

    const updateQuery = `
      UPDATE ${competitionsTable}
      SET "${answersKey}" = $1::jsonb,
          "questions" = $2::jsonb,
          "updated_at" = now()
      WHERE "competition_id" = $3
      RETURNING *
    `

    const updateParams = [
      JSON.stringify(existingAnswers),
      JSON.stringify(questions),
      competitionId
    ]

    const { rows: updatedRows } = await postgres.query(updateQuery, updateParams)
    const [competition] = await loadCompetitionRelations(updatedRows, defaultRelations)
    return competition || null
  }

  static async checkBothAnswersSubmitted(competitionId, questionId) {
    const { rows } = await postgres.query(
      `
      SELECT "learner1_answers", "learner2_answers"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    if (!rows.length) {
      return false
    }

    const [data] = rows
    const learner1Submitted = data.learner1_answers?.some((answer) => answer.questionId === questionId)
    const learner2Submitted = data.learner2_answers?.some((answer) => answer.questionId === questionId)

    return Boolean(learner1Submitted && learner2Submitted)
  }

  static async determineWinner(competitionId, questionId = null) {
    const { rows } = await postgres.query(
      `
      SELECT
        "learner1_id",
        "learner2_id",
        "learner1_answers",
        "learner2_answers"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    if (!rows.length) {
      return null
    }

    const [data] = rows

    const filterAnswers = (answers = []) =>
      questionId ? answers.filter((answer) => answer.questionId === questionId) : answers

    const learner1Answers = filterAnswers(data.learner1_answers || [])
    const learner2Answers = filterAnswers(data.learner2_answers || [])

    const learner1Score =
      learner1Answers.reduce((total, answer) => total + (answer.score || 0), 0) || 0
    const learner2Score =
      learner2Answers.reduce((total, answer) => total + (answer.score || 0), 0) || 0

    const learner1Time =
      learner1Answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0
    const learner2Time =
      learner2Answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0

    let winner =
      learner1Score > learner2Score
        ? 'Player A'
        : learner2Score > learner1Score
        ? 'Player B'
        : 'Tie'

    if (winner === 'Tie' && learner1Score === learner2Score && learner1Score > 0) {
      if (learner1Time !== learner2Time) {
        winner = learner1Time < learner2Time ? 'Player A' : 'Player B'
      }
    }

    const player1Rank =
      learner1Score > learner2Score ? 1 : learner2Score > learner1Score ? 2 : 2
    const player2Rank =
      learner2Score > learner1Score ? 1 : learner1Score > learner2Score ? 2 : 2

    const baseResult = {
      winner,
      player1Score: learner1Score,
      player2Score: learner2Score,
      player1Rank,
      player2Rank,
      player1Time: learner1Time,
      player2Time: learner2Time
    }

    if (questionId) {
      return {
        questionId,
        completed_at: new Date().toISOString(),
        ...baseResult
      }
    }

    return baseResult
  }

  static async upsertSummary(summary) {
    const winnerId =
      summary.winner_id ??
      summary.winner?.learner_id ??
      summary.winner?.user_id ??
      null
    const learner1Score =
      summary.learner1_score ??
      summary.performance_learner1?.score ??
      null
    const learner2Score =
      summary.learner2_score ??
      summary.performance_learner2?.score ??
      null
    const updatePayload = {
      status: 'completed',
      timer: summary.timer || null,
      performance_learner1: summary.performance_learner1 || null,
      performance_learner2: summary.performance_learner2 || null,
      score: summary.score ?? null,
      questions_answered: summary.questions_answered ?? null,
      updated_at: new Date().toISOString(),
      winner_id: winnerId,
      learner1_score: learner1Score,
      learner2_score: learner2Score
    }

    if (summary.course_name !== undefined) {
      updatePayload.course_name = summary.course_name
    }
    if (summary.course_id !== undefined) {
      updatePayload.course_id = summary.course_id
    }
    if (summary.learner1_id !== undefined) {
      updatePayload.learner1_id = summary.learner1_id
    }
    if (summary.learner2_id !== undefined) {
      updatePayload.learner2_id = summary.learner2_id
    }

    const updateQuery = buildUpdateStatement(
      competitionsTable,
      updatePayload,
      `WHERE "competition_id" = $${Object.keys(updatePayload).length + 1}`,
      [summary.competition_id]
    )

    const { rows } = await postgres.query(updateQuery.text, updateQuery.values)

    if (rows.length) {
      const [competition] = await loadCompetitionRelations(rows, defaultRelations)
      return competition || null
    }

      const insertPayload = {
        competition_id: summary.competition_id,
      course_name: summary.course_name ?? null,
      course_id: summary.course_id ?? null,
      learner1_id: summary.learner1_id ?? null,
      learner2_id: summary.learner2_id ?? null,
      winner_id: winnerId,
      learner1_score: learner1Score,
      learner2_score: learner2Score,
        status: 'completed',
        timer: summary.timer || null,
        performance_learner1: summary.performance_learner1 || null,
        performance_learner2: summary.performance_learner2 || null,
        score: summary.score ?? null,
        questions_answered: summary.questions_answered ?? null,
        created_at: summary.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

    const insertQuery = buildInsertStatement(competitionsTable, insertPayload)
    const insertResult = await postgres.query(insertQuery.text, insertQuery.values)
    const [competition] = await loadCompetitionRelations(insertResult.rows, defaultRelations)
    return competition || insertPayload
  }

  static async saveQuestionsState(competitionId, questions, meta = {}) {
    const updateFragments = ['"questions" = $1::jsonb', '"updated_at" = now()']
    const params = [JSON.stringify(questions || [])]
    let paramIndex = 2

    if (meta.questions_answered !== undefined && meta.questions_answered !== null) {
      updateFragments.push(`"questions_answered" = $${paramIndex}`)
      params.push(meta.questions_answered)
      paramIndex += 1
    }

    const updateQuery = `
      UPDATE ${competitionsTable}
      SET ${updateFragments.join(', ')}
      WHERE "competition_id" = $${paramIndex}
      RETURNING *
    `

    params.push(competitionId)

    const { rows } = await postgres.query(updateQuery, params)
    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
    return competition || null
  }

  static async recordQuestionResult(competitionId, questionId, questionResult) {
    const { rows } = await postgres.query(
      `
      SELECT "questions", "questions_answered"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    if (!rows.length) {
      return null
    }

    const competitionRow = rows[0]
    const questions = Array.isArray(competitionRow.questions)
      ? competitionRow.questions.map((question) => ({ ...question }))
      : []

    const questionIndex = questions.findIndex(
      (question) => question.id === questionId || question.question_id === questionId
    )

    if (questionIndex === -1) {
      return null
    }

    const question = questions[questionIndex]
    const state = ensureQuestionTurnState(question, questionIndex)

    state.completed = true
    state.is_active = false
    state.result = {
      ...(state.result || {}),
      ...questionResult
    }
    state.completed_at = questionResult?.completed_at || new Date().toISOString()

    const questionsAnswered = Math.max(
      competitionRow.questions_answered ?? 0,
      questionIndex + 1
    )

    const updatedCompetition = await this.saveQuestionsState(competitionId, questions, {
      questions_answered: questionsAnswered
    })

    const resultPayload = {
      per_question: {
        [questionId]: {
          ...questionResult,
          recorded_at: new Date().toISOString()
        }
      }
    }

    const competitionWithResult = await this.updateResult(competitionId, resultPayload)
    return competitionWithResult || updatedCompetition
  }

  static async setActiveQuestion(competitionId, nextIndex) {
    const { rows } = await postgres.query(
      `
      SELECT "questions", "questions_answered"
      FROM ${competitionsTable}
      WHERE "competition_id" = $1
      LIMIT 1
      `,
      [competitionId]
    )

    if (!rows.length) {
      return null
    }

    const competitionRow = rows[0]
    const questions = Array.isArray(competitionRow.questions)
      ? competitionRow.questions.map((question) => ({ ...question }))
      : []

    questions.forEach((question, index) => {
      const state = ensureQuestionTurnState(question, index)
      state.is_active = index === nextIndex
      if (index === nextIndex) {
        state.started_at = new Date().toISOString()
        state.timer = question.timeLimit || DEFAULT_TURN_TIMER
        state.learner1 = normalizeLearnerTurnState({ submitted: false })
        state.learner2 = normalizeLearnerTurnState({ submitted: false })
        state.completed = false
        state.result = null
      }
    })

    const questionsAnswered = Math.max(competitionRow.questions_answered ?? 0, nextIndex)

    return this.saveQuestionsState(competitionId, questions, {
      questions_answered: questionsAnswered
    })
  }
}
