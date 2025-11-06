/**
 * Code Execution Service
 * API calls for code execution
 */

import api from './api.js';

const codeExecutionService = {
  /**
   * Execute code in Judge0 sandbox
   */
  async executeCode(params) {
    try {
      const response = await api.post('/api/code/execute', params);
      return response.data;
    } catch (error) {
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
};

export default codeExecutionService;





