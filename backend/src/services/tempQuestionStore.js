import { randomUUID } from 'crypto'
import { postgres } from '../config/database.js'

export const createRequestId = () => randomUUID()

const extractHints = (questions = []) =>
  questions.flatMap((question) => {
    if (!question) return []
    if (Array.isArray(question.hints)) return question.hints
    if (Array.isArray(question.clues)) return question.clues
    return []
  })

const extractTestCases = (questions = []) =>
  questions.flatMap((question) => {
    if (!question) return []
    if (Array.isArray(question.test_cases)) return question.test_cases
    if (Array.isArray(question.testCases)) return question.testCases
    return []
  })

export const saveTempQuestions = async ({
  requestId,
  requesterService,
  action,
  questions = [],
  metadata = {}
}) => {
  console.log('\n📋 [tempQuestionStore] saveTempQuestions called')
  console.log(`   Request ID: ${requestId}`)
  console.log(`   Requester Service: ${requesterService}`)
  console.log(`   Action: ${action}`)
  console.log(`   Questions count: ${questions.length}`)
  console.log(`   Metadata:`, JSON.stringify(metadata, null, 2))
  
  const record = {
    id: randomUUID(),
    request_id: requestId,
    question: {
      requester_service: requesterService,
      action,
      questions,
      metadata
    },
    hints: extractHints(questions),
    test_cases: extractTestCases(questions),
    status: 'pending',
    updated_at: new Date().toISOString()
  }

  console.log(`   Generated record ID: ${record.id}`)
  console.log(`   Hints extracted: ${record.hints.length}`)
  console.log(`   Test cases extracted: ${record.test_cases.length}`)
  console.log(`   Status: ${record.status}`)
  
  try {
    console.log(`   Executing INSERT query for temp_questions...`)
    const result = await postgres.query(
      `
      INSERT INTO "temp_questions" (
        "id",
        "request_id",
        "question",
        "hints",
        "test_cases",
        "status",
        "created_at",
        "updated_at"
      )
      VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, now(), $7)
      ON CONFLICT ("request_id")
      DO UPDATE SET
        "question" = EXCLUDED."question",
        "hints" = EXCLUDED."hints",
        "test_cases" = EXCLUDED."test_cases",
        "status" = EXCLUDED."status",
        "updated_at" = EXCLUDED."updated_at"
      RETURNING "id", "request_id", "status", "created_at"
      `,
      [
        record.id,
        record.request_id,
        JSON.stringify(record.question),
        JSON.stringify(record.hints),
        JSON.stringify(record.test_cases),
        record.status,
        record.updated_at
      ]
    )
    
    console.log(`   ✅ INSERT query executed successfully`)
    console.log(`   Rows returned: ${result.rows ? result.rows.length : 0}`)
    if (result.rows && result.rows.length > 0) {
      console.log(`   Saved record:`, JSON.stringify(result.rows[0], null, 2))
    }
    
    return result.rows[0]
  } catch (error) {
    console.error(`   ❌ INSERT query failed:`)
    console.error(`   Error message: ${error.message}`)
    console.error(`   Error code: ${error.code || 'N/A'}`)
    console.error(`   Error detail: ${error.detail || 'N/A'}`)
    console.error(`   Error hint: ${error.hint || 'N/A'}`)
    console.error(`   Error stack: ${error.stack || 'N/A'}`)
    throw error
  }
}

export const confirmTempQuestions = async ({ requestId }) => {
  const timestamp = new Date().toISOString()
  const { rows } = await postgres.query(
    `
    UPDATE "temp_questions"
    SET "status" = 'confirmed',
        "updated_at" = $2
    WHERE "request_id" = $1
    RETURNING "id"
    `,
    [requestId, timestamp]
  )

  if (!rows.length) {
    return false
  }

  await postgres.query(
    `
    DELETE FROM "temp_questions"
    WHERE "request_id" = $1
    `,
    [requestId]
  )

  return true
}

export const getTempQuestionById = async (requestId) => {
  const { rows } = await postgres.query(
    `
    SELECT *
    FROM "temp_questions"
    WHERE "request_id" = $1
    LIMIT 1
    `,
    [requestId]
  )

  return rows[0] || null
}

