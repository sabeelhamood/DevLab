/**
 * Feedback Service
 * API calls for feedback generation
 */

import api from './api.js';

const feedbackService = {
  /**
   * Generate AI feedback for solution
   */
  async generateFeedback(params) {
    try {
      const response = await api.post('/api/feedback/generate', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate feedback: ${error.message}`);
    }
  }
};

export default feedbackService;





