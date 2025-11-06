/**
 * Competition Service
 * API calls for competition system
 */

import api from './api.js';

const competitionService = {
  /**
   * Get pending invitations for learner
   */
  async getInvitations(learnerId) {
    try {
      const response = await api.get(`/api/competitions/invitations/${learnerId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get invitations: ${error.message}`);
    }
  },

  /**
   * Select competitor from list
   */
  async selectCompetitor(invitationId, competitorAnonymousId) {
    try {
      const response = await api.post('/api/competitions/select-competitor', {
        invitation_id: invitationId,
        selected_competitor_anonymous_id: competitorAnonymousId
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to select competitor: ${error.message}`);
    }
  },

  /**
   * Submit solution in competition
   */
  async submitSolution(competitionId, solution) {
    try {
      const response = await api.post(`/api/competitions/${competitionId}/submit`, solution);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to submit solution: ${error.message}`);
    }
  },

  /**
   * Get competition status
   */
  async getCompetitionStatus(competitionId) {
    try {
      const response = await api.get(`/api/competitions/${competitionId}/status`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get competition status: ${error.message}`);
    }
  }
};

export default competitionService;





