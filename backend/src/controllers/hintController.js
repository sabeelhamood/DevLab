/**
 * Hint Controller
 * Handles hint generation and retrieval requests
 */

import hintService from '../services/hintService.js';
import logger from '../utils/logger.js';

const hintController = {
  /**
   * Generate all 3 hints for a question (single API call)
   * POST /api/feedback/hints/generate
   */
  async generateHints(req, res, next) {
    try {
      const { question_id, question_context } = req.body;

      // Validate request
      if (!question_id || !question_context) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['question_id', 'question_context']
        });
      }

      // Generate all 3 hints in single API call
      const hints = await hintService.generateHints(question_id, question_context);

      logger.info('Hints generated successfully', {
        question_id,
        hints_count: hints.length
      });

      res.json({
        success: true,
        hints
      });
    } catch (error) {
      logger.error('Hint generation error:', error);
      next(error);
    }
  },

  /**
   * Retrieve specific hint (from cache)
   * GET /api/feedback/hints/:questionId/:hintNumber
   */
  async getHint(req, res, next) {
    try {
      const { questionId, hintNumber } = req.params;

      const hintNumberInt = parseInt(hintNumber, 10);
      if (hintNumberInt < 1 || hintNumberInt > 3) {
        return res.status(400).json({
          error: 'Hint number must be between 1 and 3'
        });
      }

      const hint = await hintService.getHint(questionId, hintNumberInt);

      if (!hint) {
        return res.status(404).json({
          error: 'Hint not found. Generate hints first.'
        });
      }

      res.json({
        hint_number: hintNumberInt,
        hint_text: hint
      });
    } catch (error) {
      logger.error('Hint retrieval error:', error);
      next(error);
    }
  }
};

export default hintController;



