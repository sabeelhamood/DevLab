/**
 * Hint Service
 * API calls for hint generation
 */

import api from './api.js';

const hintService = {
  /**
   * Generate all 3 hints for a question (single API call)
   */
  async generateHints(questionId, questionContext) {
    try {
      const response = await api.post('/api/feedback/hints/generate', {
        question_id: questionId,
        question_context: questionContext
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate hints: ${error.message}`);
    }
  },

  /**
   * Get specific hint (from cache)
   */
  async getHint(questionId, hintNumber) {
    try {
      const response = await api.get(`/api/feedback/hints/${questionId}/${hintNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get hint: ${error.message}`);
    }
  }
};

export default hintService;



