/**
 * Content Studio Simulator
 * Simulates Content Studio requests for testing and development
 * This allows testing the full integration flow without real Content Studio
 */

import axios from 'axios';
import { config } from '../config/environment.js';
import logger from './logger.js';
import {
  mockContentStudioCodingRequest,
  mockContentStudioHebrewRequest,
  mockContentStudioArabicRequest,
  generateMockContentStudioRequest
} from '../mocks/contentStudioMocks.js';

class ContentStudioSimulator {
  constructor() {
    // DEVLAB's own API URL (for internal simulation)
    this.devlabUrl = process.env.DEVLAB_URL || `http://localhost:${config.port}`;
  }

  /**
   * Simulate Content Studio sending a request to DEVLAB
   * This is used for testing the integration flow
   */
  async simulateContentStudioRequest(mockRequest = null) {
    try {
      const request = mockRequest || mockContentStudioCodingRequest;
      
      logger.info('Simulating Content Studio request to DEVLAB', {
        lesson_id: request.lesson_id,
        language: request.language,
        question_type: request.question_type
      });

      // Send request to DEVLAB's Content Studio endpoint
      const response = await axios.post(
        `${this.devlabUrl}/api/content-studio/questions/generate`,
        request,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds for question generation
        }
      );

      logger.info('Content Studio simulation successful', {
        lesson_id: request.lesson_id,
        questions_generated: response.data.questions?.length || 0,
        language: response.data.metadata?.language
      });

      return response.data;
    } catch (error) {
      logger.error('Content Studio simulation failed', {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Simulate multiple Content Studio requests
   */
  async simulateBatchRequests(requests = null) {
    try {
      const batchRequests = requests || [
        mockContentStudioCodingRequest,
        mockContentStudioHebrewRequest,
        mockContentStudioArabicRequest
      ];

      logger.info('Simulating batch Content Studio requests', {
        batch_size: batchRequests.length
      });

      const response = await axios.post(
        `${this.devlabUrl}/api/content-studio/questions/batch`,
        { requests: batchRequests },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2 minutes for batch
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Batch simulation failed', {
        message: error.message
      });
      throw error;
    }
  }

  /**
   * Test different languages
   */
  async testLanguageSupport() {
    const languages = ['english', 'hebrew', 'arabic', 'russian', 'spanish'];
    const results = [];

    for (const language of languages) {
      try {
        const request = generateMockContentStudioRequest({
          language,
          lesson_id: `test_${language}_${Date.now()}`
        });

        const result = await this.simulateContentStudioRequest(request);
        results.push({
          language,
          success: true,
          questions_count: result.questions?.length || 0
        });
      } catch (error) {
        results.push({
          language,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

export default new ContentStudioSimulator();

