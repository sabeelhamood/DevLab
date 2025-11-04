/**
 * Code Execution Controller
 * Handles code execution requests
 */

import codeExecutionService from '../services/codeExecutionService.js';
import logger from '../utils/logger.js';

const codeExecutionController = {
  /**
   * Execute code in Judge0 sandbox
   * POST /api/code/execute
   */
  async executeCode(req, res, next) {
    try {
      const { code, programming_language, test_cases, question_id } = req.body;

      // Validate request
      if (!code || !programming_language || !test_cases || !question_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['code', 'programming_language', 'test_cases', 'question_id']
        });
      }

      // Execute code
      const results = await codeExecutionService.executeCode({
        code,
        programming_language,
        test_cases,
        question_id
      });

      logger.info('Code executed successfully', {
        question_id,
        status: results.status
      });

      res.json({
        success: true,
        execution_id: `exec_${Date.now()}`,
        results
      });
    } catch (error) {
      logger.error('Code execution error:', error);
      next(error);
    }
  }
};

export default codeExecutionController;



