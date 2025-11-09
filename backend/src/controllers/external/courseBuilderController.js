import { mockMicroservices } from '../../services/mockMicroservices.js'
import { CompetitionModel } from '../../models/Competition.js'
import { createRequestId } from '../../services/tempQuestionStore.js'

const buildCompetitionRecord = ({
  competitionId,
  courseId,
  learnerId,
  opponentId,
  createdAt
}) => ({
  competition_id: competitionId,
  course_id: courseId,
  learner1_id: learnerId,
  learner2_id: opponentId || null,
  status: 'pending',
  created_at: createdAt
})

export const courseBuilderController = {
  /**
   * Receive notification that a learner finished a course.
   * Fire-and-forget creation of an anonymous competition invitation.
   */
  async handleCourseCompletion(req, res) {
    try {
      const { course_id, learner_id, course_name } = req.body || {}

      if (!course_id || !learner_id || !course_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: course_id, learner_id, course_name'
        })
      }

      // Look up additional learners who completed the same course
      const competitionService = mockMicroservices.assessmentService?.competitionService

      const eligibleLearners =
        competitionService?.getEligibleLearners?.(course_id) || []

      const opponent = eligibleLearners.find((entry) => entry.user_id !== learner_id) || null

      // Create competition invitation asynchronously (mocked)
      const invitation =
        competitionService?.createCompetitionInvitation?.(course_id, null, 'intermediate') || null

      const competitionId = invitation?.competition_id || invitation?.invitation_id || createRequestId()
      const createdAt = new Date().toISOString()

      const payload = {
        invitation_id: competitionId,
        primary_learner_id: learner_id,
        opponent_candidate: opponent,
        course_id,
        course_name,
        created_at: createdAt
      }

      try {
        await CompetitionModel.create(
          buildCompetitionRecord({
            competitionId,
            courseId: course_id,
            learnerId: learner_id,
            opponentId: opponent?.user_id,
            createdAt
          })
        )
      } catch (dbError) {
        console.error('Course Builder persistence error:', dbError)
      }

      console.log('📨 Course Builder: processed completion payload', payload)

      // Fire-and-forget acknowledgement
      return res.status(202).json({
        success: true,
        message: 'Competition invitation processing scheduled',
        metadata: { invitation_id: payload.invitation_id }
      })
    } catch (error) {
      console.error('Course Builder handler error:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to process course completion payload'
      })
    }
  }
}


