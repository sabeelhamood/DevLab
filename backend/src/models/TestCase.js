import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildPagination,
  buildUpdateStatement,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const testCasesTable = postgres.quoteIdentifier(tables.testCases)
const questionsTable = postgres.quoteIdentifier(tables.questions)

const loadTestCaseRelations = async (testCases = []) => {
  if (!testCases.length) {
    return []
  }

  const questionIds = [
    ...new Set(
      testCases
        .map((testCase) => testCase.question_id)
        .filter(Boolean)
    )
  ]

  let questionsMap = {}
  if (questionIds.length) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${questionsTable} WHERE "question_id" = ANY($1::uuid[])`,
      [questionIds]
    )

    questionsMap = rows.reduce((acc, question) => {
      acc[question.question_id] = question
      return acc
    }, {})
  }

  return testCases.map((testCase) => ({
    ...testCase,
    question: testCase.question_id ? questionsMap[testCase.question_id] || null : null
  }))
}

export class TestCaseModel {
  static async create(testCaseData) {
    const query = buildInsertStatement(testCasesTable, testCaseData)
    const { rows } = await postgres.query(query.text, query.values)
    const [testCase] = await loadTestCaseRelations(rows)
    return testCase
  }

  static async findById(testCaseId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${testCasesTable} WHERE "testCase_id" = $1 LIMIT 1`,
      [testCaseId]
    )

    if (!rows.length) {
      return null
    }

    const [testCase] = await loadTestCaseRelations(rows)
    return testCase || null
  }

  static async findAll(page = 1, limit = 10) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `
        SELECT *
        FROM ${testCasesTable}
        ORDER BY "created_at" DESC
        LIMIT $1
        OFFSET $2
        `,
        [pageLimit, offset]
      ),
      runCountQuery(testCasesTable)
    ])

    const data = await loadTestCaseRelations(rows)
    return { data, count }
  }

  static async findByQuestion(questionId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${testCasesTable}
      WHERE "question_id" = $1
      ORDER BY "created_at" ASC
      `,
      [questionId]
    )

    return loadTestCaseRelations(rows)
  }

  static async findByCourse(courseId) {
    const { rows } = await postgres.query(
      `
      SELECT tc.*
      FROM ${testCasesTable} tc
      INNER JOIN ${questionsTable} q ON tc."question_id" = q."question_id"
      WHERE q."course_id" = $1
      ORDER BY tc."created_at" DESC
      `,
      [courseId]
    )

    return loadTestCaseRelations(rows)
  }

  static async findByTopic(topicId) {
    const { rows } = await postgres.query(
      `
      SELECT tc.*
      FROM ${testCasesTable} tc
      INNER JOIN ${questionsTable} q ON tc."question_id" = q."question_id"
      WHERE q."topic_id" = $1
      ORDER BY tc."created_at" DESC
      `,
      [topicId]
    )

    return loadTestCaseRelations(rows)
  }

  static async update(testCaseId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      testCasesTable,
      fields,
      `WHERE "testCase_id" = $${Object.keys(fields).length + 1}`,
      [testCaseId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    const [testCase] = await loadTestCaseRelations(rows)
    return testCase || null
  }

  static async delete(testCaseId) {
    await postgres.query(
      `
      DELETE FROM ${testCasesTable}
      WHERE "testCase_id" = $1
      `,
      [testCaseId]
    )
    return true
  }

  static async deleteByQuestion(questionId) {
    await postgres.query(
      `
      DELETE FROM ${testCasesTable}
      WHERE "question_id" = $1
      `,
      [questionId]
    )
    return true
  }

  static async createMultiple(questionId, testCasesData) {
    if (!Array.isArray(testCasesData) || testCasesData.length === 0) {
      return []
    }

    const payload = testCasesData.map((testCase) => [
      questionId,
      testCase.input ?? null,
      testCase.expected_output ?? null,
      testCase.explanation ?? null,
      testCase.metadata ? JSON.stringify(testCase.metadata) : null
    ])

    const placeholders = payload
      .map(
        (_, index) =>
          `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5})`
      )
      .join(', ')

    const values = payload.flat()

    const insertSql = `
      INSERT INTO ${testCasesTable} (
        "question_id",
        "input",
        "expected_output",
        "explanation",
        "metadata"
      )
      VALUES ${placeholders}
      RETURNING *
    `

    const { rows } = await postgres.query(insertSql, values)
    return loadTestCaseRelations(rows)
  }

  static async getForExecution(questionId) {
    const { rows } = await postgres.query(
      `
      SELECT "input", "expected_output"
      FROM ${testCasesTable}
      WHERE "question_id" = $1
      ORDER BY "created_at" ASC
      `,
      [questionId]
    )

    return rows
  }

  static async validateTestCase(testCaseId, actualOutput) {
    const { rows } = await postgres.query(
      `
      SELECT "expected_output"
      FROM ${testCasesTable}
      WHERE "testCase_id" = $1
      LIMIT 1
      `,
      [testCaseId]
    )

    if (!rows.length) {
      return null
    }

    const expected = rows[0].expected_output
    const passed = expected === actualOutput

    return {
      testCaseId,
      expected,
      actual: actualOutput,
      passed
    }
  }

  static async getQuestionStats(questionId) {
    const { rows } = await postgres.query(
      `
      SELECT *
      FROM ${testCasesTable}
      WHERE "question_id" = $1
      `,
      [questionId]
    )

    return {
      total_test_cases: rows.length,
      test_cases: rows
    }
  }
}

