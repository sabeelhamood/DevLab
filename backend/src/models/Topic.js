import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildUpdateStatement,
  buildPagination,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const topicsTable = postgres.quoteIdentifier(tables.topics)
const coursesTable = postgres.quoteIdentifier(tables.courses)
const questionsTable = postgres.quoteIdentifier(tables.questions)
const practicesTable = postgres.quoteIdentifier(tables.practices)

const loadRelatedData = async (topics = [], options = {}) => {
  if (!topics.length) {
    return []
  }

  const courseIds = [
    ...new Set(
      topics
        .map((topic) => topic.course_id)
        .filter(Boolean)
    )
  ]

  let coursesMap = {}
  if (courseIds.length && options.includeCourse) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "course_id" = ANY($1::uuid[])`,
      [courseIds]
    )

    coursesMap = rows.reduce((acc, course) => {
      acc[course.course_id] = course
      return acc
    }, {})
  }

  let questionsMap = {}
  if (options.includeQuestions) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${questionsTable} WHERE "topic_id" = ANY($1::uuid[]) ORDER BY "created_at" ASC`,
      [topics.map((topic) => topic.topic_id)]
    )

    questionsMap = rows.reduce((acc, question) => {
      const key = question.topic_id
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(question)
      return acc
    }, {})
  }

  let practicesMap = {}
  if (options.includePractices) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${practicesTable} WHERE "topic_id" = ANY($1::uuid[]) ORDER BY "created_at" DESC`,
      [topics.map((topic) => topic.topic_id)]
    )

    practicesMap = rows.reduce((acc, practice) => {
      const key = practice.topic_id
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(practice)
      return acc
    }, {})
  }

  return topics.map((topic) => {
    const result = { ...topic }

    if (options.includeCourse) {
      result.course = coursesMap[topic.course_id] || null
    }

    if (options.includeQuestions) {
      result.questions = questionsMap[topic.topic_id] || []
    }

    if (options.includePractices) {
      result.practices = practicesMap[topic.topic_id] || []
    }

    return result
  })
}

export class TopicModel {
  static async create(topicData) {
    const query = buildInsertStatement(topicsTable, topicData)
    const { rows } = await postgres.query(query.text, query.values)
    const [topic] = await loadRelatedData(rows, {
      includeCourse: true,
      includeQuestions: true,
      includePractices: true
    })
    return topic
  }

  static async findById(topicId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${topicsTable} WHERE "topic_id" = $1 LIMIT 1`,
      [topicId]
    )

    if (!rows.length) {
      return null
    }

    const [topic] = await loadRelatedData(rows, {
      includeCourse: true,
      includeQuestions: true,
      includePractices: true
    })

    return topic || null
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)
    const conditions = []
    const values = []

    if (filters.course_id) {
      values.push(filters.course_id)
      conditions.push(`"course_id" = $${values.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `
        SELECT *
        FROM ${topicsTable}
        ${whereClause}
        ORDER BY "created_at" DESC
        LIMIT $${values.length + 1}
        OFFSET $${values.length + 2}
        `,
        [...values, pageLimit, offset]
      ),
      runCountQuery(topicsTable, conditions.join(' AND '), values)
    ])

    const data = await loadRelatedData(rows, { includeCourse: true })
    return { data, count }
  }

  static async findByCourse(courseId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${topicsTable}
      WHERE "course_id" = $1
      ORDER BY "created_at" ASC
      `,
      [courseId]
    )

    const topics = await loadRelatedData(rows, {
      includeCourse: true,
      includeQuestions: true,
      includePractices: true
    })
    return topics
  }

  static async update(topicId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      topicsTable,
      fields,
      `WHERE "topic_id" = $${Object.keys(fields).length + 1}`,
      [topicId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [topic] = await loadRelatedData(rows, {
      includeCourse: true,
      includeQuestions: true,
      includePractices: true
    })
    return topic || null
  }

  static async delete(topicId) {
    await postgres.query(
      `DELETE FROM ${topicsTable} WHERE "topic_id" = $1`,
      [topicId]
    )
    return true
  }

  static async findBySkills(skills = []) {
    const serialized = JSON.stringify(Array.isArray(skills) ? skills : [])
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${topicsTable}
      WHERE "skills" @> $1::jsonb
      ORDER BY "created_at" DESC
      `,
      [serialized]
    )

    const topics = await loadRelatedData(rows, { includeCourse: true })
    return topics
  }

  static async updateSkills(topicId, skills = []) {
    const query = buildUpdateStatement(
      topicsTable,
      {
        skills,
        updated_at: new Date().toISOString()
      },
      'WHERE "topic_id" = $3',
      [topicId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [topic] = await loadRelatedData(rows, {
      includeCourse: true,
      includeQuestions: true,
      includePractices: true
    })
    return topic || null
  }

  static async getTopicStats(topicId) {
    const { rows } = await postgres.query(
      `
      SELECT "status", "score"
      FROM ${practicesTable}
      WHERE "topic_id" = $1
      `,
      [topicId]
    )

    const totalPractices = rows.length
    const completedPractices = rows.filter((practice) => practice.status === 'completed').length
    const averageScore =
      totalPractices > 0
        ? rows.reduce((sum, practice) => sum + (practice.score || 0), 0) / totalPractices
        : 0

    return {
      total_practices: totalPractices,
      completed_practices: completedPractices,
      average_score: averageScore
    }
  }
}

