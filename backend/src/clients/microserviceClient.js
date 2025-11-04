/**
 * EduCore Microservice Client
 * Client for interacting with other EduCore microservices
 * Implements automatic rollback to mock data when microservices fail
 */

import axios from 'axios';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';
import {
  mockAssessmentTheoreticalQuestions,
  mockLearningAnalyticsResponse,
  mockCourseBuilderResponse,
  mockRAGResponse,
  mockContentStudioValidationResponse,
  mockContentStudioNotificationResponse,
  isValidResponse,
  shouldFallback
} from './microserviceMocks.js';

class MicroserviceClient {
  constructor() {
    this.services = {
      courseBuilder: config.microservices.courseBuilder,
      contentStudio: config.microservices.contentStudio,
      assessment: config.microservices.assessment,
      learningAnalytics: config.microservices.learningAnalytics,
      rag: config.microservices.rag
    };
    this.apiKey = config.security.serviceApiKey;
  }

  /**
   * Send competition performance data to Learning Analytics
   * Falls back to mock data if microservice is unavailable
   */
  async sendCompetitionPerformance(data) {
    try {
      const response = await axios.post(
        `${this.services.learningAnalytics}/api/competitions/performance`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 5000
        }
      );

      // Validate response
      if (!isValidResponse(response)) {
        logger.warn('Invalid response from Learning Analytics, falling back to mock data', {
          status: response.status,
          competition_id: data.competition_id
        });
        return mockLearningAnalyticsResponse(data);
      }

      logger.info('Competition performance sent to Learning Analytics', {
        competition_id: data.competition_id
      });

      return response.data;
    } catch (error) {
      // Check if we should fallback
      if (shouldFallback(error)) {
        logger.warn('Learning Analytics microservice unavailable, using mock data', {
          error: error.message,
          competition_id: data.competition_id
        });
        return mockLearningAnalyticsResponse(data);
      }
      
      logger.error('Failed to send performance data:', error);
      // Don't throw - this is non-critical, return mock
      return mockLearningAnalyticsResponse(data);
    }
  }

  /**
   * Forward theoretical question request to Assessment
   * Falls back to mock data if microservice is unavailable
   */
  async createTheoreticalQuestions(params) {
    try {
      const response = await axios.post(
        `${this.services.assessment}/api/questions/theoretical/create`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 10000
        }
      );

      // Validate response structure
      const expectedStructure = ['questions', 'success'];
      if (!isValidResponse(response, expectedStructure)) {
        logger.warn('Invalid response from Assessment microservice, falling back to mock data', {
          status: response.status
        });
        return mockAssessmentTheoreticalQuestions(params);
      }

      // Check if response data is valid
      if (!response.data || !response.data.questions || !Array.isArray(response.data.questions)) {
        logger.warn('Malformed response from Assessment microservice, falling back to mock data');
        return mockAssessmentTheoreticalQuestions(params);
      }

      logger.info('Theoretical questions forwarded to Assessment');

      return response.data;
    } catch (error) {
      // Check if we should fallback
      if (shouldFallback(error)) {
        logger.warn('Assessment microservice unavailable, using mock data', {
          error: error.message
        });
        return mockAssessmentTheoreticalQuestions(params);
      }
      
      logger.error('Failed to forward theoretical questions:', error);
      // Fallback to mock data instead of throwing
      return mockAssessmentTheoreticalQuestions(params);
    }
  }

  /**
   * Notify Course Builder about course completion
   * Falls back to mock data if microservice is unavailable
   */
  async notifyCourseCompletion(data) {
    try {
      const response = await axios.post(
        `${this.services.courseBuilder}/api/courses/completion`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (!isValidResponse(response)) {
        logger.warn('Invalid response from Course Builder, falling back to mock data');
        return mockCourseBuilderResponse(data);
      }

      logger.info('Course completion notified to Course Builder', {
        course_id: data.course_id,
        learner_id: data.learner_id
      });

      return response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        logger.warn('Course Builder microservice unavailable, using mock data', {
          error: error.message
        });
        return mockCourseBuilderResponse(data);
      }
      
      logger.error('Failed to notify course completion:', error);
      return mockCourseBuilderResponse(data);
    }
  }

  /**
   * Query RAG chatbot
   * Falls back to mock data if microservice is unavailable
   */
  async queryRAG(query, context = {}) {
    try {
      const response = await axios.post(
        `${this.services.rag}/api/chat`,
        { query, context },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (!isValidResponse(response)) {
        logger.warn('Invalid response from RAG microservice, falling back to mock data');
        return mockRAGResponse(query);
      }

      logger.info('RAG query processed successfully');

      return response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        logger.warn('RAG microservice unavailable, using mock data', {
          error: error.message
        });
        return mockRAGResponse(query);
      }
      
      logger.error('Failed to query RAG:', error);
      return mockRAGResponse(query);
    }
  }

  /**
   * Notify Content Studio about successful question generation
   * Falls back to mock data if Content Studio is unavailable
   */
  async notifyQuestionGeneration(questionData) {
    try {
      const response = await axios.post(
        `${this.services.contentStudio}/api/questions/generated`,
        {
          question_ids: questionData.question_ids || [],
          lesson_id: questionData.lesson_id,
          course_name: questionData.course_name,
          quantity: questionData.quantity,
          question_type: questionData.question_type,
          status: 'completed'
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (!isValidResponse(response)) {
        logger.warn('Invalid response from Content Studio, falling back to mock data');
        return mockContentStudioNotificationResponse(questionData);
      }

      logger.info('Question generation notification sent to Content Studio', {
        lesson_id: questionData.lesson_id,
        quantity: questionData.quantity
      });

      return response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        logger.warn('Content Studio microservice unavailable, using mock notification', {
          error: error.message
        });
        return mockContentStudioNotificationResponse(questionData);
      }
      
      logger.error('Failed to notify Content Studio:', error);
      return mockContentStudioNotificationResponse(questionData);
    }
  }

  /**
   * Validate content with Content Studio
   * Falls back to mock data if microservice is unavailable
   */
  async validateContent(data) {
    try {
      const response = await axios.post(
        `${this.services.contentStudio}/api/content/validate`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 5000
        }
      );

      if (!isValidResponse(response)) {
        logger.warn('Invalid response from Content Studio, falling back to mock data');
        return mockContentStudioValidationResponse(data);
      }

      logger.info('Content validated by Content Studio');

      return response.data;
    } catch (error) {
      if (shouldFallback(error)) {
        logger.warn('Content Studio microservice unavailable, using mock data', {
          error: error.message
        });
        return mockContentStudioValidationResponse(data);
      }
      
      logger.error('Failed to validate content:', error);
      return mockContentStudioValidationResponse(data);
    }
  }

  /**
   * Health check for microservice
   */
  async healthCheck(serviceName) {
    try {
      const serviceUrl = this.services[serviceName];
      if (!serviceUrl) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 3000
      });

      return response.status === 200;
    } catch (error) {
      logger.warn(`Health check failed for ${serviceName}:`, error.message);
      return false;
    }
  }
}

export default new MicroserviceClient();



