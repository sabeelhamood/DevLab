import { getFetch } from '../utils/http.js'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Parse SQL response from OpenAI, handling code blocks and extra text
 */
const parseSqlResponse = (raw) => {
  if (!raw || typeof raw !== 'string') {
    return null
  }

  // Try to extract SQL from code blocks
  const codeBlockMatch = raw.match(/```(?:sql)?\s*([\s\S]*?)\s*```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Return the trimmed raw string
  return raw.trim()
}

/**
 * Generate a PostgreSQL SELECT query from a natural language request using OpenAI
 * @param {Object} payload - The request payload from Coordinator
 * @returns {Promise<string>} PostgreSQL SELECT query string
 */
export async function generateQueryFromRequest(payload) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not configured')
  }

  const fetchFn = await getFetch()

  const systemPrompt = `You are an SQL generator for a Learning Analytics system.
Your job is to convert a natural language analytics request into a **PostgreSQL SELECT query** based on the schema of the table "competitions_vs_ai".

CRITICAL RULES:
1. Output ONLY raw SQL.
2. SQL must be a single SELECT statement.
3. Never output anything except SQL.
4. Use ONLY these fields:
competition_id, learner_id, learner_name, course_id, course_name,
learner_answers, ai_answers, questions, winner, score,
created_at, updated_at, in_progress_answers, status,
timer_seconds, started_at, completed_at, current_question_index
5. Allowed operators: =, !=, >, >=, <, <=, IN
6. Never generate INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE.
7. Never use wildcard conditions like WHERE 1=1.
8. Always query from: competitions_vs_ai
9. Format: SELECT ... FROM competitions_vs_ai WHERE ...
10. The SQL query MUST always end with a single semicolon. Never include more than one semicolon.

Use the request below to decide which filters to apply.
If a field is not in the allowed list, ignore it completely.

Return ONLY the SQL query.`

  const userPrompt = `Generate a PostgreSQL SELECT query for the following analytics request:
${JSON.stringify(payload, null, 2)}`

  const response = await fetchFn(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.2 // Lower temperature for more consistent SQL output
    })
  })

  const responseBody = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      responseBody?.error?.message ||
      JSON.stringify(responseBody || {}) ||
      'No response body'
    throw new Error(`OpenAI API responded with status ${response.status}: ${message}`)
  }

  const content = responseBody?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI API returned an empty response')
  }

  const sqlQuery = parseSqlResponse(content)
  if (!sqlQuery || typeof sqlQuery !== 'string' || !sqlQuery.trim()) {
    throw new Error('OpenAI API returned invalid SQL query')
  }

  // Validate that it's a SELECT query only
  const trimmedSql = sqlQuery.trim().toUpperCase()
  if (!trimmedSql.startsWith('SELECT')) {
    throw new Error('Generated query must be a SELECT statement only')
  }

  // Check for forbidden SQL keywords
  const forbiddenKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE', 'EXEC', 'EXECUTE']
  for (const keyword of forbiddenKeywords) {
    if (trimmedSql.includes(keyword)) {
      throw new Error(`Generated query contains forbidden keyword: ${keyword}`)
    }
  }

  // Enforce exactly one semicolon at the end
  let cleaned = sqlQuery.trim()
  // Remove any trailing semicolons (to avoid multiple)
  cleaned = cleaned.replace(/;+$/, '')
  // Force a single semicolon at the end
  cleaned = cleaned + ';'

  return cleaned
}


