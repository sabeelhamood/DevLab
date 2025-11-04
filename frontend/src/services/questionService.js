/**
 * Question Service
 * API calls for question generation
 */

import api from './api.js';

const questionService = {
  /**
   * Generate practice questions
   */
  async generateQuestions(params) {
    try {
      const response = await api.post('/api/questions/generate', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  },

  /**
   * Validate trainer question
   */
  async validateQuestion(params) {
    try {
      const response = await api.post('/api/questions/validate', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to validate question: ${error.message}`);
    }
  }
};

export default questionService;



