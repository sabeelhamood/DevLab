/**
 * Feedback Service
 * Business logic for feedback generation
 */

import geminiClient from '../clients/geminiClient.js';
import logger from '../utils/logger.js';

const feedbackService = {
  /**
   * Generate AI feedback for solution
   */
  async generateFeedback(params) {
    try {
      const { code, question_context, execution_results, is_correct } = params;

      const feedback = await geminiClient.generateFeedback({
        code,
        question_context,
        execution_results,
        is_correct
      });

      return feedback;
    } catch (error) {
      logger.error('Feedback generation service error:', error);
      throw error;
    }
  }
};

export default feedbackService;





