/**
 * Competition Controller
 * Handles competition-related requests
 */

import competitionService from '../services/competitionService.js';
import logger from '../utils/logger.js';

const competitionController = {
  /**
   * Create competition invitation (from Course Builder)
   * POST /api/competitions/invite
   */
  async createInvitation(req, res, next) {
    try {
      const { course_id, learner_id } = req.body;

      if (!course_id || !learner_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['course_id', 'learner_id']
        });
      }

      // Create invitation asynchronously (Course Builder doesn't wait for response)
      const invitation = await competitionService.createInvitation(course_id, learner_id);

      // Return simple acknowledgment - Course Builder doesn't process this response
      // This is a fire-and-forget notification pattern
      res.json({
        success: true,
        message: 'Notification received'
      });
    } catch (error) {
      logger.error('Competition invitation creation error:', error);
      next(error);
    }
  },

  /**
   * Get pending invitations for learner
   * GET /api/competitions/invitations/:learnerId
   */
  async getInvitations(req, res, next) {
    try {
      const { learnerId } = req.params;

      const invitations = await competitionService.getInvitations(learnerId);

      res.json({
        invitations
      });
    } catch (error) {
      logger.error('Get invitations error:', error);
      next(error);
    }
  },

  /**
   * Learner selects competitor from list
   * POST /api/competitions/select-competitor
   */
  async selectCompetitor(req, res, next) {
    try {
      const { invitation_id, selected_competitor_anonymous_id } = req.body;

      if (!invitation_id || !selected_competitor_anonymous_id) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      await competitionService.selectCompetitor(invitation_id, selected_competitor_anonymous_id);

      res.json({
        success: true,
        message: 'Competitor selected successfully'
      });
    } catch (error) {
      logger.error('Competitor selection error:', error);
      next(error);
    }
  },

  /**
   * Submit solution in competition
   * POST /api/competitions/:competitionId/submit
   */
  async submitSolution(req, res, next) {
    try {
      const { competitionId } = req.params;
      const { question_id, code, programming_language } = req.body;

      if (!question_id || !code || !programming_language) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      const result = await competitionService.submitSolution(competitionId, {
        question_id,
        code,
        programming_language
      });

      res.json(result);
    } catch (error) {
      logger.error('Solution submission error:', error);
      next(error);
    }
  },

  /**
   * Get competition status
   * GET /api/competitions/:competitionId/status
   */
  async getCompetitionStatus(req, res, next) {
    try {
      const { competitionId } = req.params;

      const status = await competitionService.getCompetitionStatus(competitionId);

      res.json(status);
    } catch (error) {
      logger.error('Get competition status error:', error);
      next(error);
    }
  }
};

export default competitionController;



