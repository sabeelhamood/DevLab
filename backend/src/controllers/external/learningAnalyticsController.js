import { CompetitionModel } from '../../models/Competition.js'
import { CompetitionAIModel } from '../../models/CompetitionAI.js'
import { postgres } from '../../config/database.js'

const competitionsVsAiTable = postgres.quoteIdentifier('competitions_vs_ai')

const parseJsonField = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

const mapCompetitionRow = (row) => {
  if (!row) return null
  return {
    ...row,
    questions: parseJsonField(row.questions),
    ai_answers: parseJsonField(row.ai_answers),
    learner_answers: parseJsonField(row.learner_answers),
    in_progress_answers: parseJsonField(row.in_progress_answers)
  }
}

export const learningAnalyticsController = {
  /**
   * Query competition performance data from competitions_vs_ai table
   * Called by Learning Analytics via Coordinator (Pull Model)
   * Supports filtering by learner_id, course_id, or returns all if no filter
   */
  async queryCompetitions(req, res) {
    try {
      const { learner_id, course_id, competition_id, status } = req.body || {}

      // Build WHERE conditions based on provided filters
      const conditions = []
      const values = []
      let paramIndex = 1

      if (learner_id) {
        conditions.push(`"learner_id" = $${paramIndex}::uuid`)
        values.push(learner_id)
        paramIndex++
      }

      if (course_id) {
        conditions.push(`"course_id" = $${paramIndex}::text`)
        values.push(String(course_id))
        paramIndex++
      }

      if (competition_id) {
        conditions.push(`"competition_id" = $${paramIndex}::uuid`)
        values.push(competition_id)
        paramIndex++
      }

      if (status) {
        conditions.push(`"status" = $${paramIndex}::text`)
        values.push(status)
        paramIndex++
      }

      // Build the query
      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
      const query = `
        SELECT *
        FROM ${competitionsVsAiTable}
        ${whereClause}
        ORDER BY "created_at" DESC
      `

      console.log('📈 [Learning Analytics] Querying competitions:', {
        learner_id,
        course_id,
        competition_id,
        status,
        conditionsCount: conditions.length
      })

      // Execute the query
      const { rows } = await postgres.query(query, values)

      // Parse JSON fields and map results
      const results = rows.map(mapCompetitionRow)

      console.log('✅ [Learning Analytics] Query completed:', {
        resultsCount: results.length
      })

      return res.status(200).json({
        success: true,
        data: results,
        count: results.length
      })
    } catch (error) {
      console.error('❌ [Learning Analytics] Query error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to query competition data',
        message: error.message
      })
    }
  },

  /**
   * Legacy method - kept for backward compatibility but should not be used
   * This was the old push model that received data FROM Learning Analytics
   * @deprecated Use queryCompetitions instead
   */
  async sendCompetitionSummary(req, res) {
    try {
      const {
        learner1_id,
        learner2_id,
        course_id,
        timer,
        performance_learner1,
        performance_learner2,
        score,
        questions_answered,
        competition_id,
        created_at
      } = req.body || {}

      if (
        !learner1_id ||
        !learner2_id ||
        !course_id ||
        !competition_id ||
        typeof score === 'undefined' ||
        typeof questions_answered === 'undefined'
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Missing required fields: learner1_id, learner2_id, course_id, competition_id, score, questions_answered'
        })
      }

      const payload = {
        learner1_id,
        learner2_id,
        course_id,
        timer,
        performance_learner1,
        performance_learner2,
        score,
        questions_answered,
        competition_id,
        created_at: created_at || new Date().toISOString()
      }

      console.log('📈 Learning Analytics payload received:', payload)

      try {
        await CompetitionModel.upsertSummary(payload)
      } catch (dbError) {
        console.error('Learning Analytics persistence error:', dbError)
      }

      return res.status(202).json({
        success: true,
        message: 'Competition performance forwarded to Learning Analytics',
        metadata: { competition_id }
      })
    } catch (error) {
      console.error('Learning Analytics error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to forward competition data'
      })
    }
  }
}
