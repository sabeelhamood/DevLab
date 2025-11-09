import { getSupabaseTables, postgres } from '../config/database.js'
import {
  buildInsertStatement,
  buildUpdateStatement,
  buildPagination,
  runCountQuery
} from '../utils/postgresHelpers.js'

const { userProfiles } = getSupabaseTables()
const table = postgres.quoteIdentifier(userProfiles)

export class UserProfileModel {
  static async create(userData) {
    const query = buildInsertStatement(table, userData)
    const { rows } = await postgres.query(query.text, query.values)
    return rows[0]
  }

  static async findById(userId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${table} WHERE "user_id" = $1 LIMIT 1`,
      [userId]
    )

    return rows[0] || null
  }

  static async findByEmail(email) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${table} WHERE "email" = $1 LIMIT 1`,
      [email]
    )

    return rows[0] || null
  }

  static async update(userId, updateData) {
    const fields = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const query = buildUpdateStatement(
      table,
      fields,
      `WHERE "user_id" = $${Object.keys(fields).length + 1}`,
      [userId]
    )

    const { rows } = await postgres.query(query.text, query.values)
    return rows[0] || null
  }

  static async delete(userId) {
    await postgres.query(
      `DELETE FROM ${table} WHERE "user_id" = $1`,
      [userId]
    )
    return true
  }

  static async findAll(page = 1, limit = 10) {
    const { limit: pageLimit, offset } = buildPagination(page, limit)

    const [{ rows }, count] = await Promise.all([
      postgres.query(
        `SELECT * FROM ${table} ORDER BY "created_at" DESC LIMIT $1 OFFSET $2`,
        [pageLimit, offset]
      ),
      runCountQuery(table)
    ])

    return { data: rows, count }
  }

  static async findByOrganization(organizationId) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${table} WHERE "organizationId" = $1`,
      [organizationId]
    )

    return rows
  }

  static async findByRole(role) {
    const { rows } = await postgres.query(
      `SELECT * FROM ${table} WHERE "role" = $1`,
      [role]
    )

    return rows
  }

  static async getCompletedCourses(userId) {
    const { rows } = await postgres.query(
      `SELECT "completed_courses" FROM ${table} WHERE "user_id" = $1 LIMIT 1`,
      [userId]
    )

    return rows[0]?.completed_courses ?? []
  }

  static async getActiveCourses(userId) {
    const { rows } = await postgres.query(
      `SELECT "active_courses" FROM ${table} WHERE "user_id" = $1 LIMIT 1`,
      [userId]
    )

    return rows[0]?.active_courses ?? []
  }
}


