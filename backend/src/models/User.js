import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildUpdateStatement,
  buildPagination,
  runCountQuery
} from '../utils/postgresHelpers.js'

const tables = getSupabaseTables()
const profileTable = postgres.quoteIdentifier(tables.userProfiles)
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions)

export class UserProfileModel {
  static async create(userData) {
    if (!userData?.learner_id) {
      throw new Error('learner_id is required to create a user profile')
    }

    const payload = {
      learner_id: userData.learner_id,
      learner_name: userData.learner_name ?? null
    }

    const query = buildInsertStatement(profileTable, payload)
    const { rows } = await postgres.query(query.text, query.values)
    return rows[0]
  }

  static async findById(learnerId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${profileTable} WHERE "learner_id" = $1 LIMIT 1`,
      [learnerId]
    )

    return rows[0] || null
  }

  static async update(learnerId, updateData) {
    const fields = {}

    if (updateData?.learner_name !== undefined) {
      fields.learner_name = updateData.learner_name
    }

    fields.updated_at = new Date().toISOString()

    if (Object.keys(fields).length === 1 && fields.updated_at) {
      // nothing to update besides timestamp
      return this.findById(learnerId)
    }

    const query = buildUpdateStatement(
      profileTable,
      fields,
      `WHERE "learner_id" = $${Object.keys(fields).length + 1}`,
      [learnerId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    return rows[0] || null
  }

  static async delete(learnerId) {
    await postgres.query(
      `DELETE FROM ${profileTable} WHERE "learner_id" = $1`,
      [learnerId]
    )
    return true
  }

  static async findAll(page = 1, limit = 10) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `SELECT * FROM ${profileTable} ORDER BY "created_at" DESC LIMIT $1 OFFSET $2`,
        [pageLimit, offset]
      ),
      runCountQuery(profileTable)
    ])

    return { data: rows, count }
  }

  static async getCompletedCourses(learnerId) {
    const { rows } = await postgres.query(
      `
      SELECT "course_id", "completed_at"
      FROM ${courseCompletionsTable}
      WHERE "learner_id" = $1
      ORDER BY "completed_at" DESC
      `,
      [learnerId]
    )

    return rows
  }
}


