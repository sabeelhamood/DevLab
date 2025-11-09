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

  await postgres.query(
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

