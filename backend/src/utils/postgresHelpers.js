import { postgres } from '../config/database.js'

const quoteColumn = (column) => `"${column.replace(/"/g, '""')}"`

export const buildInsertStatement = (tableName, data, returning = '*') => {
  const keys = Object.keys(data)

  if (keys.length === 0) {
    throw new Error('No data provided for insert')
  }

  const columns = keys.map((key) => quoteColumn(key)).join(', ')
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ')
  const values = keys.map((key) => data[key])

  const returningClause = returning ? ` RETURNING ${returning}` : ''

  return {
    text: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})${returningClause}`,
    values
  }
}

export const buildUpdateStatement = (tableName, updates, whereClause, whereParams = [], returning = '*') => {
  const keys = Object.keys(updates)

  if (keys.length === 0) {
    throw new Error('No fields provided for update')
  }

  const setClause = keys
    .map((key, index) => `${quoteColumn(key)} = $${index + 1}`)
    .join(', ')

  const values = keys.map((key) => updates[key])
  const returningClause = returning ? ` RETURNING ${returning}` : ''

  return {
    text: `UPDATE ${tableName} SET ${setClause} ${whereClause}${returningClause}`,
    values: [...values, ...whereParams]
  }
}

export const runCountQuery = async (tableName, whereSql = '', params = []) => {
  const whereClause = whereSql ? `WHERE ${whereSql}` : ''
  const { rows } = await postgres.query(
    `SELECT COUNT(*)::integer AS count FROM ${tableName} ${whereClause}`,
    params
  )

  return rows[0]?.count ?? 0
}

export const buildPagination = (page = 1, limit = 10) => {
  const pageSize = Math.max(Number(limit) || 10, 1)
  const offset = Math.max(Number(page) || 1, 1)

  return {
    limit: pageSize,
    offset: (offset - 1) * pageSize
  }
}


