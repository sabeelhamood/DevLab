import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildUpdateStatement
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const questionsTable = postgres.quoteIdentifier(tables.questions)
const topicsTable = postgres.quoteIdentifier(tables.topics)
const coursesTable = postgres.quoteIdentifier(tables.courses)
const testCasesTable = postgres.quoteIdentifier(tables.testCases)

const loadQuestionRelations = async (questions = [], options = {}) => {
  if (!questions.length) {
    return []
  }

  const topicIds = [
    ...new Set(
      questions
        .map((question) => question.topic_id)
        .filter(Boolean)
    )
  ]

  const courseIds = [
    ...new Set(
      questions
        .map((question) => question.course_id)
        .filter(Boolean)
    )
  ]

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

  let testCasesMap = {}
  if (options.includeTestCases) {
    const questionIds = questions.map((question) => question.question_id)
    const { rows } = await postgres.query(
      `SELECT * FROM ${testCasesTable} WHERE "question_id" = ANY($1::uuid[]) ORDER BY "created_at" ASC`,
      [questionIds]
    )

    testCasesMap = rows.reduce((acc, testCase) => {
      const key = testCase.question_id
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(testCase)
      return acc
    }, {})
  }

  return questions.map((question) => {
    const result = { ...question }

    if (options.includeTopic) {
      result.topic = topicsMap[question.topic_id] || null
    }

    if (options.includeCourse) {
      result.course = coursesMap[question.course_id] || null
    }

    if (options.includeTestCases) {
      result.testCases = testCasesMap[question.question_id] || []
    }

    return result
  })
}

export class QuestionModel {
  static async create(questionData) {
    const query = buildInsertStatement(questionsTable, questionData)
    const { rows } = await postgres.query(query.text, query.values)
    const [question] = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeCourse: true,
      includeTestCases: true
    })
    return question
  }

  static async findById(questionId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${questionsTable} WHERE "question_id" = $1 LIMIT 1`,
      [questionId]
    )

    if (!rows.length) {
      return null
    }

    const [question] = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeCourse: true,
      includeTestCases: true
    })
    return question || null
  }

  static async findByTopic(topicId, limit = 10) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      WHERE "topic_id" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [topicId, limit]
    )

    const questions = await loadQuestionRelations(rows, { includeTestCases: true })
    return questions
  }

  static async getRandomQuestions(topicId, count = 4, difficulty = null, questionType = null) {
    const conditions = ['"topic_id" = $1']
    const values = [topicId]

    if (difficulty) {
      values.push(difficulty)
      conditions.push(`"difficulty" = $${values.length}`)
    }

    if (questionType) {
      values.push(questionType)
      conditions.push(`"question_type" = $${values.length}`)
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`
    const limit = count * 2

    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      ${whereClause}
      ORDER BY RANDOM()
      LIMIT $${values.length + 1}
      `,
      [...values, limit]
    )

    const questions = await loadQuestionRelations(rows, { includeTestCases: true })
    return questions.slice(0, count)
  }

  static async update(questionId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      questionsTable,
      fields,
      `WHERE "question_id" = $${Object.keys(fields).length + 1}`,
      [questionId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [question] = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeCourse: true,
      includeTestCases: true
    })
    return question || null
  }

  static async delete(questionId) {
    await postgres.query(
      `DELETE FROM ${questionsTable} WHERE "question_id" = $1`,
      [questionId]
    )
    return true
  }

  static async findByPractice(practiceId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      WHERE "practice_id" = $1
      ORDER BY "created_at" ASC
      `,
      [practiceId]
    )

    const questions = await loadQuestionRelations(rows, { includeTestCases: true })
    return questions
  }

  static async findByType(questionType, limit = 10) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      WHERE "question_type" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [questionType, limit]
    )

    const questions = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeTestCases: true
    })
    return questions
  }

  static async findByTags(tags, limit = 10) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      WHERE "tags" @> $1::jsonb
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [JSON.stringify(tags), limit]
    )

    const questions = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeTestCases: true
    })
    return questions
  }

  static async findByCourse(courseId, limit = 10) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${questionsTable}
      WHERE "course_id" = $1
      ORDER BY "created_at" DESC
      LIMIT $2
      `,
      [courseId, limit]
    )

    const questions = await loadQuestionRelations(rows, {
      includeTopic: true,
      includeTestCases: true
    })
    return questions
  }
}

