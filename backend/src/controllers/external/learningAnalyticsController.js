import { CompetitionModel } from '../../models/Competition.js'

export const learningAnalyticsController = {
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
