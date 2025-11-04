/**
 * Judge0 API Client
 * Client for executing code in Judge0 sandbox
 */

import axios from 'axios';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

class Judge0Client {
  constructor() {
    // RapidAPI configuration for Judge0 Free Plan (set in Railway Service Variables)
    // Get your free RapidAPI key from: https://rapidapi.com/judge0-official/api/judge0-ce
    // Subscribe to the free plan and get your RapidAPI key and host
    // Variable names in Railway: x-rapidapi-key and x-rapidapi-host
    // Both values are automatically loaded from Railway Service Variables - no manual .env needed
    this.apiKey = config.externalApis.judge0.apiKey; // X-RapidAPI-Key (from Railway: x-rapidapi-key)
    this.apiHost = config.externalApis.judge0.apiHost; // X-RapidAPI-Host (from Railway: x-rapidapi-host)
    this.apiUrl = config.externalApis.judge0.apiUrl;
    this.languageMap = {
      'python': 92,
      'java': 91,
      'javascript': 93,
      'cpp': 54,
      'c++': 54,
      'go': 95,
      'rust': 73
    };
  }

  /**
   * Execute code in Judge0 sandbox
   * @param {Object} params - Execution parameters
   * @returns {Promise<Object>} Execution results
   */
  async executeCode(params) {
    try {
      const { code, programming_language, test_cases, question_id } = params;

      const languageId = this.getLanguageId(programming_language);
      if (!languageId) {
        throw new Error(`Unsupported programming language: ${programming_language}`);
      }

      // Create submission
      const submission = await this.createSubmission(code, languageId);
      const submissionId = submission.token;

      // Poll for results
      const results = await this.getSubmissionResults(submissionId);

      logger.info('Code executed successfully', {
        question_id,
        language: programming_language,
        status: results.status.description
      });

      return this.formatResults(results, test_cases);
    } catch (error) {
      logger.error('Judge0 execution error:', {
        error: error.message,
        question_id: params.question_id,
        language: params.programming_language
      });
      
      // Handle specific error cases
      if (error.response) {
        // HTTP error response from RapidAPI/Judge0
        const status = error.response.status;
        const errorMessage = error.response.data?.message || error.message;
        
        if (status === 401 || status === 403) {
          throw new Error('Judge0 API authentication failed. Please check your RapidAPI key in Railway Service Variables.');
        } else if (status === 429) {
          throw new Error('Judge0 API rate limit exceeded. Please try again later.');
        } else if (status >= 500) {
          throw new Error('Judge0 API server error. Please try again later.');
        } else {
          throw new Error(`Code execution failed: ${errorMessage}`);
        }
      } else if (error.request) {
        // Network error (no response received)
        throw new Error('Unable to connect to Judge0 API. Please check your internet connection.');
      } else {
        // Other errors
        throw new Error(`Code execution failed: ${error.message}`);
      }
    }
  }

  /**
   * Create submission in Judge0
   */
  async createSubmission(code, languageId) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/submissions`,
        {
          source_code: code,
          language_id: languageId,
          stdin: '',
          expected_output: '',
          cpu_time_limit: 5,
          memory_limit: 256000,
          wall_time_limit: 5
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': this.apiKey, // From Railway Service Variables (JUDGE0_API_KEY)
            'X-RapidAPI-Host': this.apiHost // From Railway Service Variables (JUDGE0_API_HOST)
          },
          params: {
            base64_encoded: 'false',
            wait: 'false'
          }
        }
      );

      // Validate successful response
      if (response.status >= 200 && response.status < 300) {
        return response.data;
      } else {
        throw new Error(`Failed to create submission: HTTP ${response.status}`);
      }
    } catch (error) {
      logger.error('Judge0 submission creation error:', error);
      if (error.response) {
        throw new Error(`Failed to create submission: ${error.response.data?.message || error.message}`);
      }
      throw new Error(`Failed to create submission: ${error.message}`);
    }
  }

  /**
   * Get submission results (polling)
   */
  async getSubmissionResults(submissionId, maxAttempts = 10) {
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.get(
          `${this.apiUrl}/submissions/${submissionId}`,
          {
            headers: {
              'X-RapidAPI-Key': this.apiKey, // From Railway Service Variables (JUDGE0_API_KEY)
              'X-RapidAPI-Host': this.apiHost // From Railway Service Variables (JUDGE0_API_HOST)
            },
            params: {
              base64_encoded: 'false',
              fields: '*'
            }
          }
        );

        const status = response.data.status;

        // Status 1 and 2 mean processing, 3 means finished
        if (status.id === 3) {
          return response.data;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
    }

    throw new Error('Timeout waiting for execution results');
  }

  /**
   * Format results for response
   */
  formatResults(results, testCases) {
    const status = results.status;
    const stdout = results.stdout || '';
    const stderr = results.stderr || '';
    const compile_output = results.compile_output || '';

    const testCaseResults = testCases.map(testCase => {
      const passed = stdout.trim() === testCase.expected_output.trim();
      return {
        input: testCase.input,
        expected_output: testCase.expected_output,
        actual_output: stdout,
        passed
      };
    });

    const allPassed = testCaseResults.every(tc => tc.passed);

    return {
      status: status.description,
      status_id: status.id,
      stdout,
      stderr,
      compile_output,
      time: results.time,
      memory: results.memory,
      test_case_results: testCaseResults,
      is_correct: allPassed && status.id === 3
    };
  }

  /**
   * Get language ID from language name
   */
  getLanguageId(language) {
    const normalized = language.toLowerCase().trim();
    return this.languageMap[normalized] || null;
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languageMap);
  }
}

export default new Judge0Client();



