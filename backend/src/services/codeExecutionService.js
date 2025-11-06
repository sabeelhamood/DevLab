/**
 * Code Execution Service
 * Business logic for code execution
 */

import judge0Client from '../clients/judge0Client.js';
import logger from '../utils/logger.js';

const codeExecutionService = {
  /**
   * Execute code in Judge0 sandbox
   */
  async executeCode(params) {
    try {
      const { code, programming_language, test_cases, question_id } = params;

      // Validate code size
      if (code.length > 1000000) { // 1MB limit
        throw new Error('Code size exceeds maximum limit (1MB)');
      }

      // Execute via Judge0
      const results = await judge0Client.executeCode({
        code,
        programming_language,
        test_cases,
        question_id
      });

      return results;
    } catch (error) {
      logger.error('Code execution service error:', error);
      throw error;
    }
  }
};

export default codeExecutionService;





