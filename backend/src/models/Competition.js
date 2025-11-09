import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildPagination,
  buildUpdateStatement,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const competitionsTable = postgres.quoteIdentifier(tables.competitions)
const coursesTable = postgres.quoteIdentifier(tables.courses)
const usersTable = postgres.quoteIdentifier(tables.userProfiles)

const loadCompetitionRelations = async (competitions = []) => {
  if (!competitions.length) {
    return []
  }

  const courseIds = [
    ...new Set(
      competitions
        .map((competition) => competition.course_id)
        .filter(Boolean)
    )
  ]

  const learnerIds = [
    ...new Set(
      competitions
        .flatMap((competition) => [competition.learner1_id, competition.learner2_id])
        .filter(Boolean)
    )
  ]

  let coursesMap = {}
  if (courseIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "course_id" = ANY($1::uuid[])`,
      [courseIds]
    )

    coursesMap = rows.reduce((acc, course) => {
      acc[course.course_id] = course
      return acc
    }, {})
  }

  let learnersMap = {}
  if (learnerIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${usersTable} WHERE "user_id" = ANY($1::uuid[])`,
      [learnerIds]
    )

    learnersMap = rows.reduce((acc, learner) => {
      acc[learner.user_id] = learner
      return acc
    }, {})
  }

  return competitions.map((competition) => ({
    ...competition,
    course: competition.course_id ? coursesMap[competition.course_id] || null : null,
    learner1: competition.learner1_id ? learnersMap[competition.learner1_id] || null : null,
    learner2: competition.learner2_id ? learnersMap[competition.learner2_id] || null : null
  }))
}

const defaultRelations = {
  includeCourse: true,
  includeLearners: true
}

export class CompetitionModel {
  static async create(competitionData) {
    const query = buildInsertStatement(competitionsTable, competitionData)
    const { rows } = await postgres.query(query.text, query.values)
    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
    return competition
  }

  static async findById(competitionId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${competitionsTable} WHERE "competition_id" = $1 LIMIT 1`,
      [competitionId]
    )

    if (!rows.length) {
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
    const query = buildUpdateStatement(
      competitionsTable,
      {
        result,
        updated_at: new Date().toISOString()
      },
      'WHERE "competition_id" = $3',
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
        FROM "course_completions"
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
    const column =
      learnerId === 'learner1_id'
        ? '"learner1_answers"'
        : '"learner2_answers"'

    const { rows } = await postgres.query(
      `
      UPDATE ${competitionsTable}
      SET ${column} = $1,
          "updated_at" = now()
      WHERE "competition_id" = $2
      RETURNING *
      `,
      [answerData, competitionId]
    )

    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
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

  static async updateCurrentQuestion(competitionId, questionNumber) {
    const { rows } = await postgres.query(
      `
      UPDATE ${competitionsTable}
      SET "current_question" = $1,
          "updated_at" = now()
      WHERE "competition_id" = $2
      RETURNING *
      `,
      [questionNumber, competitionId]
    )

    const [competition] = await loadCompetitionRelations(rows, defaultRelations)
    return competition || null
  }

  static async determineWinner(competitionId) {
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
      return null
    }

    const [data] = rows

    const learner1Score =
      data.learner1_answers?.reduce((total, answer) => total + (answer.score || 0), 0) || 0
    const learner2Score =
      data.learner2_answers?.reduce((total, answer) => total + (answer.score || 0), 0) || 0

    const winner =
      learner1Score > learner2Score
        ? 'Player A'
        : learner2Score > learner1Score
        ? 'Player B'
        : 'Tie'

    return {
      winner,
      player1Score: learner1Score,
      player2Score: learner2Score,
      player1Rank: learner1Score > learner2Score ? 1 : 2,
      player2Rank: learner2Score > learner1Score ? 1 : 2,
      player1Time:
        data.learner1_answers?.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0,
      player2Time:
        data.learner2_answers?.reduce((total, answer) => total + (answer.timeSpent || 0), 0) || 0
    }
  }

  static async upsertSummary(summary) {
    const updatePayload = {
      status: 'completed',
      timer: summary.timer || null,
      performance_learner1: summary.performance_learner1 || null,
      performance_learner2: summary.performance_learner2 || null,
      score: summary.score ?? null,
      questions_answered: summary.questions_answered ?? null,
      analytics_snapshot: summary.analytics_snapshot || summary,
      updated_at: new Date().toISOString()
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
      course_id: summary.course_id || null,
      learner1_id: summary.learner1_id || null,
      learner2_id: summary.learner2_id || null,
      status: 'completed',
      timer: summary.timer || null,
      performance_learner1: summary.performance_learner1 || null,
      performance_learner2: summary.performance_learner2 || null,
      score: summary.score ?? null,
      questions_answered: summary.questions_answered ?? null,
      analytics_snapshot: summary.analytics_snapshot || summary,
      created_at: summary.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const insertQuery = buildInsertStatement(competitionsTable, insertPayload)
    const insertResult = await postgres.query(insertQuery.text, insertQuery.values)
    const [competition] = await loadCompetitionRelations(insertResult.rows, defaultRelations)
    return competition || insertPayload
  }
}

