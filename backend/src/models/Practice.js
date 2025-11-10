import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildPagination,
  buildUpdateStatement,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const practicesTable = postgres.quoteIdentifier(tables.practices)
const usersTable = postgres.quoteIdentifier(tables.userProfiles)
const coursesTable = postgres.quoteIdentifier(tables.courses)
const topicsTable = postgres.quoteIdentifier(tables.topics)
const questionsTable = postgres.quoteIdentifier(tables.questions)

const loadPracticeRelations = async (practices = [], options = {}) => {
  if (!practices.length) {
    return []
  }

  const learnerIds = [
    ...new Set(
      practices
        .map((practice) => practice.learner_id)
        .filter(Boolean)
    )
  ]

  const courseIds = [
    ...new Set(
      practices
        .map((practice) => practice.course_id)
        .filter(Boolean)
    )
  ]

  const topicIds = [
    ...new Set(
      practices
        .map((practice) => practice.topic_id)
        .filter(Boolean)
    )
  ]

  let learnersMap = {}
  if (options.includeLearner && learnerIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${usersTable} WHERE "learner_id" = ANY($1::uuid[])`,
      [learnerIds]
    )

    learnersMap = rows.reduce((acc, learner) => {
      acc[learner.learner_id] = learner
      return acc
    }, {})
  }

  let coursesMap = {}
  if (options.includeCourse && courseIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "course_id" = ANY($1::uuid[])`,
      [courseIds]
    )

    coursesMap = rows.reduce((acc, course) => {
      acc[course.course_id] = course
      return acc
    }, {})
  }

  let topicsMap = {}
  if (options.includeTopic && topicIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${topicsTable} WHERE "topic_id" = ANY($1::uuid[])`,
      [topicIds]
    )

    topicsMap = rows.reduce((acc, topic) => {
      acc[topic.topic_id] = topic
      return acc
    }, {})
  }

  let questionsMap = {}
  if (options.includeQuestions) {
    const practiceIds = practices.map((practice) => practice.practice_id)
    if (practiceIds.length) {
      const { rows } = await postgres.query(
        `SELECT * FROM ${questionsTable} WHERE "practice_id" = ANY($1::uuid[]) ORDER BY "created_at" ASC`,
        [practiceIds]
      )

      questionsMap = rows.reduce((acc, question) => {
        const key = question.practice_id
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(question)
        return acc
      }, {})
    }
  }

  return practices.map((practice) => {
    const result = { ...practice }

    if (options.includeLearner) {
      result.learner = learnersMap[practice.learner_id] || null
    }

    if (options.includeCourse) {
      result.course = coursesMap[practice.course_id] || null
    }

    if (options.includeTopic) {
      result.topic = topicsMap[practice.topic_id] || null
    }

    if (options.includeQuestions) {
      result.questions = questionsMap[practice.practice_id] || []
    }

    return result
  })
}

const defaultRelations = {
  includeLearner: true,
  includeCourse: true,
  includeTopic: true
}

export class PracticeModel {
  static async create(practiceData) {
    const query = buildInsertStatement(practicesTable, practiceData)
    const { rows } = await postgres.query(query.text, query.values)
    const [practice] = await loadPracticeRelations(rows, { ...defaultRelations, includeQuestions: true })
    return practice
  }

  static async findById(practiceId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${practicesTable} WHERE "practice_id" = $1 LIMIT 1`,
      [practiceId]
    )

    if (!rows.length) {
      return null
    }

    const [practice] = await loadPracticeRelations(rows, { ...defaultRelations, includeQuestions: true })
    return practice || null
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)
    const conditions = []
    const values = []

    if (filters.learner_id) {
      values.push(filters.learner_id)
      conditions.push(`"learner_id" = $${values.length}`)
    }

    if (filters.course_id) {
      values.push(filters.course_id)
      conditions.push(`"course_id" = $${values.length}`)
    }

    if (filters.topic_id) {
      values.push(filters.topic_id)
      conditions.push(`"topic_id" = $${values.length}`)
    }

    if (filters.status) {
      values.push(filters.status)
      conditions.push(`"status" = $${values.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `
        SELECT *
        FROM ${practicesTable}
        ${whereClause}
        ORDER BY "created_at" DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
        `,
        [...values, pageLimit, offset]
      ),
      runCountQuery(practicesTable, conditions.join(' AND '), values)
    ])

    const data = await loadPracticeRelations(rows, defaultRelations)
    return { data, count }
  }

  static async findByLearner(learnerId, limit = 20) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      WHERE "learner_id" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [learnerId, limit]
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }

  static async findByCourse(courseId, limit = 20) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      WHERE "course_id" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [courseId, limit]
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }

  static async findByTopic(topicId, limit = 20) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      WHERE "topic_id" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [topicId, limit]
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }

  static async getActive(learnerId = null) {
    const conditions = ['"status" = $1']
    const values = ['in_progress']

    if (learnerId) {
      values.push(learnerId)
      conditions.push(`"learner_id" = $${values.length}`)
    }

    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      WHERE ${conditions.join(' AND ')}
      ORDER BY "updated_at" DESC
      `,
      values
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }

  static async getCompleted(learnerId = null) {
    const conditions = ['"status" = $1']
    const values = ['completed']

    if (learnerId) {
      values.push(learnerId)
      conditions.push(`"learner_id" = $${values.length}`)
    }

    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      WHERE ${conditions.join(' AND ')}
      ORDER BY "updated_at" DESC
      `,
      values
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }

  static async update(practiceId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      practicesTable,
      fields,
      `WHERE "practice_id" = $${Object.keys(fields).length + 1}`,
      [practiceId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [practice] = await loadPracticeRelations(rows, { ...defaultRelations, includeQuestions: true })
    return practice || null
  }

  static async updateStatus(practiceId, status) {
    return this.update(practiceId, { status })
  }

  static async updateScore(practiceId, score) {
    return this.update(practiceId, { score })
  }

  static async updateContent(practiceId, content) {
    return this.update(practiceId, { content })
  }

  static async delete(practiceId) {
    await postgres.query(
      `DELETE FROM ${practicesTable} WHERE "practice_id" = $1`,
      [practiceId]
    )
    return true
  }

  static async getLearnerStats(learnerId) {
    const { rows } = await postgres.query(
      `
      SELECT "status", "score", "time_spent"
      FROM ${practicesTable}
      WHERE "learner_id" = $1
      `,
      [learnerId]
    )

    const total = rows.length
    const completed = rows.filter((item) => item.status === 'completed').length
    const inProgress = rows.filter((item) => item.status === 'in_progress').length
    const averageScore = total
      ? rows.reduce((sum, item) => sum + (item.score || 0), 0) / total
      : 0
    const totalTime = rows.reduce((sum, item) => sum + (item.time_spent || 0), 0)

    return {
      total_practices: total,
      completed_practices: completed,
      in_progress_practices: inProgress,
      average_score: averageScore,
      total_time_spent: totalTime
    }
  }

  static async getTopicStats(topicId) {
    const { rows } = await postgres.query(
      `
      SELECT "status", "score", "learner_id"
      FROM ${practicesTable}
      WHERE "topic_id" = $1
      `,
      [topicId]
    )

    const total = rows.length
    const completed = rows.filter((item) => item.status === 'completed').length
    const averageScore = total
      ? rows.reduce((sum, item) => sum + (item.score || 0), 0) / total
      : 0
    const uniqueLearners = new Set(rows.map((item) => item.learner_id)).size

    return {
      total_practices: total,
      completed_practices: completed,
      average_score: averageScore,
      unique_learners: uniqueLearners
    }
  }

  static async getRecent(limit = 10) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${practicesTable}
      ORDER BY "created_at" DESC
      LIMIT $1
      `,
      [limit]
    )

    const practices = await loadPracticeRelations(rows, defaultRelations)
    return practices
  }
}

