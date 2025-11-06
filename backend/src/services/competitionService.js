/**
 * Competition Service
 * Business logic for competition system
 */

import matchingService from './matchingService.js';
import supabase from '../database/supabase.js';
import microserviceClient from '../clients/microserviceClient.js';
import logger from '../utils/logger.js';

const competitionService = {
  /**
   * Create competition invitation
   */
  async createInvitation(courseId, learnerId) {
    try {
      // Find potential competitors
      const competitors = await matchingService.findPotentialCompetitors(courseId, learnerId);

      if (competitors.length === 0) {
        throw new Error('No potential competitors found');
      }

      // Create invitation
      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('competition_invitations')
        .insert({
          invitation_id: invitationId,
          course_id: courseId,
          learner_id: learnerId,
          potential_competitors: competitors.map((c, index) => ({
            competitor_id: c.learner_id,
            anonymous_id: `Competitor #${index + 1}`,
            skill_level: c.skill_level,
            available: c.available
          })),
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Competition invitation created', {
        invitation_id: invitationId,
        course_id: courseId,
        learner_id: learnerId
      });

      return {
        invitation_id: invitationId,
        potential_competitors: data.potential_competitors
      };
    } catch (error) {
      logger.error('Competition invitation creation error:', error);
      throw error;
    }
  },

  /**
   * Get pending invitations for learner
   */
  async getInvitations(learnerId) {
    try {
      const { data, error } = await supabase
        .from('competition_invitations')
        .select('*')
        .eq('learner_id', learnerId)
        .eq('status', 'pending');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Get invitations error:', error);
      throw error;
    }
  },

  /**
   * Select competitor from list
   */
  async selectCompetitor(invitationId, anonymousId) {
    try {
      // Get invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('competition_invitations')
        .select('*')
        .eq('invitation_id', invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Find competitor by anonymous ID
      const competitor = invitation.potential_competitors.find(
        c => c.anonymous_id === anonymousId
      );

      if (!competitor) {
        throw new Error('Competitor not found');
      }

      // Update invitation
      const { error: updateError } = await supabase
        .from('competition_invitations')
        .update({
          selected_competitor_id: competitor.competitor_id,
          status: 'pending_acceptance'
        })
        .eq('invitation_id', invitationId);

      if (updateError) {
        throw updateError;
      }

      logger.info('Competitor selected', {
        invitation_id: invitationId,
        competitor_id: competitor.competitor_id
      });
    } catch (error) {
      logger.error('Competitor selection error:', error);
      throw error;
    }
  },

  /**
   * Submit solution in competition
   */
  async submitSolution(competitionId, solution) {
    try {
      // Get competition
      const { data: competition, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('competition_id', competitionId)
        .single();

      if (error || !competition) {
        throw new Error('Competition not found');
      }

      // Store solution (simplified - would need learner_id from auth)
      // TODO: Get learner_id from authenticated request

      return {
        success: true,
        message: 'Solution submitted successfully'
      };
    } catch (error) {
      logger.error('Solution submission error:', error);
      throw error;
    }
  },

  /**
   * Get competition status
   */
  async getCompetitionStatus(competitionId) {
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('competition_id', competitionId)
        .single();

      if (error || !data) {
        throw new Error('Competition not found');
      }

      return {
        competition_id: data.competition_id,
        status: data.status,
        questions: data.questions,
        // Don't include solutions or learner IDs (anonymity)
      };
    } catch (error) {
      logger.error('Get competition status error:', error);
      throw error;
    }
  }
};

export default competitionService;





