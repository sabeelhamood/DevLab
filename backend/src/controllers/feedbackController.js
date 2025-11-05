/**
 * Feedback Controller
 * Handles feedback generation requests
 */

import feedbackService from '../services/feedbackService.js';
import logger from '../utils/logger.js';

const feedbackController = {
  /**
   * Generate AI feedback for solution
   * POST /api/feedback/generate
   */
  async generateFeedback(req, res, next) {
    try {
      const { code, question_context, execution_results, is_correct } = req.body;

      // Validate request
      if (!code || !question_context || !execution_results || typeof is_correct !== 'boolean') {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['code', 'question_context', 'execution_results', 'is_correct']
        });
      }

      const feedback = await feedbackService.generateFeedback({
        code,
        question_context,
        execution_results,
        is_correct
      });

      res.json(feedback);
    } catch (error) {
      logger.error('Feedback generation error:', error);
      next(error);
    }
  }
};

export default feedbackController;




