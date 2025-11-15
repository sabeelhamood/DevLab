import { UserProfileModel } from '../models/User.js'
import { postgres, getSupabaseTables } from '../config/database.js'
import { CompetitionAIModel } from '../models/CompetitionAI.js'
import { competitionAIService } from '../services/competitionAIService.js'
import { getFetch } from '../utils/http.js'

const tables = getSupabaseTables()
const courseCompletionsTable = postgres.quoteIdentifier(tables.courseCompletions || 'course_completions')

const ensureUserProfile = async (learnerId, learnerName = null) => {
  if (!learnerId) {
    throw new Error('learnerId is required to upsert user profile')
  }

  const existing = await UserProfileModel.findById(learnerId)
  if (existing) {
    return existing
  }

  try {
    const name =
      typeof learnerName === 'string' && learnerName.trim().length
        ? learnerName.trim()
        : `Learner ${learnerId.slice(0, 8)}`
    return await UserProfileModel.create({
      learner_id: learnerId,
      learner_name: name
    })
  } catch (error) {
    if (error.code === '23505') {
      return UserProfileModel.findById(learnerId)
    }
    throw error
  }
}

export const competitionController = {
  async recordCourseCompletion(req, res) {
    try {
      const { learner_id, learner_name, course_id, course_name } = req.body || {}

      if (!learner_id || !course_id) {
        return res.status(400).json({
          success: false,
          error: 'learner_id and course_id are required'
        })
      }

      const payload = req.body

      const serviceApiKeys = (process.env.SERVICE_API_KEYS || '')
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)

      if (!serviceApiKeys.length) {
        console.error('❌ [competitions] SERVICE_API_KEYS missing in environment variables')
        return res.status(500).json({
          success: false,
          error: 'Service authentication misconfigured'
        })
      }

      const selectedKey = serviceApiKeys[Math.floor(Math.random() * serviceApiKeys.length)]
      const serviceId = process.env.SERVICE_API_ID || 'devlab-competitions'
      const competitionsApiUrl = process.env.COMPETITIONS_API_URL

      let upstreamStatus = null
      let upstreamBody = null

      if (!competitionsApiUrl) {
        console.warn('⚠️ [competitions] COMPETITIONS_API_URL not set; skipping forward call')
      } else {
        try {
          const fetchFn = await getFetch()
          const forwardResponse = await fetchFn(competitionsApiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': selectedKey,
              'x-service-id': serviceId
            },
            body: JSON.stringify(payload)
          })

          upstreamStatus = forwardResponse.status
          const text = await forwardResponse.text()
          upstreamBody = text

          if (!forwardResponse.ok) {
            const authFailure = forwardResponse.status === 401 || forwardResponse.status === 403
            if (authFailure) {
              console.error(
                `❌ [competitions] Authentication failed when forwarding course completion (status ${forwardResponse.status})`
              )
            } else {
              console.error(
                `⚠️ [competitions] Upstream competitions API responded with status ${forwardResponse.status}`
              )
            }
          }
        } catch (error) {
          console.error('❌ [competitions] Failed to forward course completion:', error.message)
        }
      }

      await ensureUserProfile(learner_id, learner_name || course_name)

      const { rows } = await postgres.query(
        `
        SELECT 1
        FROM ${courseCompletionsTable}
        WHERE "learner_id" = $1 AND "course_id" = $2
        LIMIT 1
        `,
        [learner_id, course_id]
      )

      let alreadyRecorded = Boolean(rows.length)
      if (!alreadyRecorded) {
        await postgres.query(
          `
          INSERT INTO ${courseCompletionsTable} (
            "learner_id",
            "course_id",
            "course_name",
            "completed_at"
          )
          VALUES ($1, $2, $3, now())
          `,
          [learner_id, course_id, course_name || null]
        )
      }

      return res.status(202).json({
        success: true,
        learner_id,
        course_id,
        course_name: course_name || null,
        alreadyRecorded,
        upstreamStatus,
        upstreamBody
      })
    } catch (error) {
      console.error('❌ [competitions] Course completion handling failed:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to record course completion'
      })
    }
  },

  async createAICompetition(req, res) {
    try {
      const { learner_id, learner_name, course_id, course_name } = req.body || {}

      if (!learner_id || !course_id || !course_name) {
        return res.status(400).json({
          success: false,
          error: 'learner_id, course_id, and course_name are required'
        })
      }

      const courseIdText = String(course_id)
      const existingCompetition = await CompetitionAIModel.findByLearnerAndCourse(learner_id, courseIdText)
      if (existingCompetition) {
        return res.status(200).json({
          success: true,
          competition: existingCompetition,
          alreadyExists: true
        })
      }

      const questions = await competitionAIService.generateCompetitionQuestions({
        courseName: course_name
      })

      const competition = await CompetitionAIModel.create({
        learnerId: learner_id,
        learnerName: learner_name || null,
        courseId: courseIdText,
        courseName: course_name,
        questions
      })

      return res.status(201).json({
        success: true,
        competition,
        alreadyExists: false
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to create AI competition:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to create AI competition',
        message: error.message
      })
    }
  },

  async getPendingAICompetitions(req, res) {
    try {
      const { learnerId } = req.params

      if (!learnerId) {
        return res.status(400).json({
          success: false,
          error: 'learnerId is required'
        })
      }

      const pendingCourses = await CompetitionAIModel.getPendingCourses(learnerId)
      return res.json({
        success: true,
        data: pendingCourses
      })
    } catch (error) {
      console.error('❌ [competitions] Failed to fetch pending competitions:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch pending competitions',
        message: error.message
      })
    }
  }
}

