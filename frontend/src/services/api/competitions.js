// frontend/src/services/api/competitions.js
import { apiClient } from './client.js';

export const competitionsAPI = {
  // Create competition invitation
  async createInvitation(courseId, topicId, difficulty = 'intermediate') {
    try {
      console.log('🏆 Competition API: Creating invitation...');
      const response = await apiClient.post('/competitions/create-invitation', {
        courseId,
        topicId,
        difficulty
      });
      console.log('✅ Competition API: Invitation created:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Create invitation failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Accept competition invitation
  async acceptInvitation(invitationId, userId) {
    try {
      console.log('🏆 Competition API: Accepting invitation...');
      const response = await apiClient.post('/competitions/accept-invitation', {
        invitationId,
        userId
      });
      console.log('✅ Competition API: Invitation accepted:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Accept invitation failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Create competition between two learners
  async createCompetition(invitationId, learner1Id, learner2Id) {
    try {
      console.log('🏆 Competition API: Creating competition...');
      const response = await apiClient.post('/competitions/create-competition', {
        invitationId,
        learner1Id,
        learner2Id
      });
      console.log('✅ Competition API: Competition created:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Create competition failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Submit answer for a competition question
  async submitAnswer(competitionId, userId, questionId, answer) {
    try {
      console.log('🏆 Competition API: Submitting answer...');
      const response = await apiClient.post('/competitions/submit-answer', {
        competitionId,
        userId,
        questionId,
        answer
      });
      console.log('✅ Competition API: Answer submitted:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Submit answer failed:', error);
      return { success: false, error: error.message };
    }
  },

  // End competition and get results
  async endCompetition(competitionId, userAnswers = []) {
    try {
      console.log('🏆 Competition API: Ending competition...');
      const response = await apiClient.post('/competitions/end-competition', {
        competitionId,
        userAnswers
      });
      console.log('✅ Competition API: Competition ended:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: End competition failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's competition history
  async getCompetitionHistory(userId) {
    try {
      console.log('🏆 Competition API: Getting competition history...');
      const response = await apiClient.get(`/competitions/history/${userId}`);
      console.log('✅ Competition API: Competition history:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Get history failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get leaderboard
  async getLeaderboard(courseId = null, timeRange = 'all') {
    try {
      console.log('🏆 Competition API: Getting leaderboard...');
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId);
      if (timeRange) params.append('timeRange', timeRange);
      
      const response = await apiClient.get(`/competitions/leaderboard?${params}`);
      console.log('✅ Competition API: Leaderboard:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Get leaderboard failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get active competitions for a user
  async getActiveCompetitions(userId) {
    try {
      console.log('🏆 Competition API: Getting active competitions...');
      const response = await apiClient.get(`/competitions/active/${userId}`);
      console.log('✅ Competition API: Active competitions:', response);
      return response;
    } catch (error) {
      console.error('❌ Competition API: Get active competitions failed:', error);
      return { success: false, error: error.message };
    }
  }
};
