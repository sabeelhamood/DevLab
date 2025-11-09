import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildUpdateStatement,
  buildPagination,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const coursesTable = postgres.quoteIdentifier(tables.courses)
const usersTable = postgres.quoteIdentifier(tables.userProfiles)
const topicsTable = postgres.quoteIdentifier(tables.topics)

const attachRelations = async (courses = []) => {
  if (!courses.length) {
    return []
  }

  const courseIds = courses.map((course) => course.course_id)
  const trainerIds = [
    ...new Set(
      courses
        .map((course) => course.trainer_id)
        .filter(Boolean)
    )
  ]

  let trainersMap = {}
  if (trainerIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${usersTable} WHERE "user_id" = ANY($1::uuid[])`,
      [trainerIds]
    )

    trainersMap = rows.reduce((acc, row) => {
      acc[row.user_id] = row
      return acc
    }, {})
  }

  const { rows: topicRows } = await postgres.query(
    `SELECT * FROM ${topicsTable} WHERE "course_id" = ANY($1::uuid[]) ORDER BY "created_at" ASC`,
    [courseIds]
  )

  const topicsMap = topicRows.reduce((acc, topic) => {
    const key = topic.course_id
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(topic)
    return acc
  }, {})

  return courses.map((course) => ({
    ...course,
    trainer: course.trainer_id ? trainersMap[course.trainer_id] || null : null,
    topics: topicsMap[course.course_id] || []
  }))
}

export class CourseModel {
  static async create(courseData) {
    const query = buildInsertStatement(coursesTable, courseData)
    const { rows } = await postgres.query(query.text, query.values)
    const [course] = await attachRelations(rows)
    return course
  }

  static async findById(courseId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "course_id" = $1 LIMIT 1`,
      [courseId]
    )

    if (!rows.length) {
      return null
    }

    const [course] = await attachRelations(rows)
    return course || null
  }

  static async findAll(page = 1, limit = 10, filters = {}) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)
    const conditions = []
    const values = []

    if (filters.level) {
      values.push(filters.level)
      conditions.push(`"level" = $${values.length}`)
    }

    if (filters.trainer_id) {
      values.push(filters.trainer_id)
      conditions.push(`"trainer_id" = $${values.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const queryText = `
      SELECT * FROM ${coursesTable}
      ${whereClause}
      ORDER BY "created_at" DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `

    const [{ rows }, count] = await Promise.all([
      postgres.query(queryText, [...values, pageLimit, offset]),
      runCountQuery(coursesTable, conditions.join(' AND '), values)
    ])

    const data = await attachRelations(rows)
    return { data, count }
  }

  static async update(courseId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      coursesTable,
      fields,
      `WHERE "course_id" = $${Object.keys(fields).length + 1}`,
      [courseId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [course] = await attachRelations(rows)
    return course || null
  }

  static async delete(courseId) {
    await postgres.query(
      `DELETE FROM ${coursesTable} WHERE "course_id" = $1`,
      [courseId]
    )
    return true
  }

  static async findByTrainer(trainerId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "trainer_id" = $1 ORDER BY "created_at" DESC`,
      [trainerId]
    )

    const courses = await attachRelations(rows)
    return courses
  }

  static async findByLevel(level) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${coursesTable} WHERE "level" = $1 ORDER BY "created_at" DESC`,
      [level]
    )

    const courses = await attachRelations(rows)
    return courses
  }

  static async updateAIFeedback(courseId, aiFeedback) {
    const query = buildUpdateStatement(
      coursesTable,
      {
        ai_feedback: aiFeedback,
        updated_at: new Date().toISOString()
      },
      'WHERE "course_id" = $3',
      [courseId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [course] = await attachRelations(rows)
    return course || null
  }
}

