/**
 * Content Studio Controller
 * Handles requests from Content Studio for question generation
 * Designed for real integration but uses mock data when Content Studio is unavailable
 */

import questionService from '../services/questionService.js';
import logger from '../utils/logger.js';

const contentStudioController = {
  /**
   * Generate questions from Content Studio request
   * POST /api/content-studio/questions/generate
   * 
   * Expected request body from Content Studio:
   * {
   *   "lesson_id": "string",
   *   "course_name": "string",
   *   "lesson_name": "string",
   *   "nano_skills": ["string"],
   *   "micro_skills": ["string"],
   *   "question_type": "code" | "theoretical",
   *   "programming_language": "string" (optional for theoretical),
   *   "quantity": number (default: 4),
   *   "language": "hebrew" | "english" | "arabic" | "russian" | etc., (REQUIRED)
   *   "difficulty": "easy" | "medium" | "hard" (optional),
   *   "category": "string" (optional),
   *   "answer_options": [...] (optional, for theoretical questions)
   * }
   */
  async generateQuestions(req, res, next) {
    try {
      const {
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        question_type,
        programming_language,
        quantity = 4,
        language, // REQUIRED: Human language for question generation
        difficulty,
        category,
        answer_options
      } = req.body;

      // Validate required fields
      const requiredFields = {
        lesson_id: 'Lesson ID',
        course_name: 'Course name',
        lesson_name: 'Lesson name',
        nano_skills: 'Nano skills',
        micro_skills: 'Micro skills',
        question_type: 'Question type',
        language: 'Language' // Language is now required
      };

      const missingFields = [];
      for (const [field, label] of Object.entries(requiredFields)) {
        if (!req.body[field]) {
          missingFields.push(label);
        }
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missing: missingFields,
          required: Object.keys(requiredFields)
        });
      }

      // Validate question_type
      if (!['code', 'theoretical'].includes(question_type)) {
        return res.status(400).json({
          error: 'Invalid question_type',
          allowed: ['code', 'theoretical']
        });
      }

      // Validate language (common languages)
      const supportedLanguages = [
        'hebrew', 'english', 'arabic', 'russian', 'spanish', 
        'french', 'german', 'chinese', 'japanese', 'korean'
      ];
      
      if (!supportedLanguages.includes(language?.toLowerCase())) {
        logger.warn('Unsupported language requested, using English as fallback', {
          requested: language,
          supported: supportedLanguages
        });
        // Don't fail, just log warning - Gemini can handle many languages
      }

      // Validate programming_language for coding questions
      if (question_type === 'code' && !programming_language) {
        return res.status(400).json({
          error: 'programming_language is required for coding questions'
        });
      }

      logger.info('Content Studio question generation request received', {
        lesson_id,
        course_name,
        question_type,
        language,
        quantity,
        programming_language: programming_language || 'N/A'
      });

      // Generate questions based on type
      let questions;
      if (question_type === 'theoretical') {
        // Route to Assessment microservice
        questions = await questionService.routeTheoreticalQuestions({
          lesson_id,
          course_name,
          lesson_name,
          nano_skills,
          micro_skills,
          quantity,
          language, // Pass language to service
          difficulty,
          category,
          answer_options
        });
      } else {
        // Generate coding questions via Gemini
        questions = await questionService.generateCodingQuestions({
          lesson_id,
          course_name,
          lesson_name,
          nano_skills,
          micro_skills,
          programming_language,
          quantity,
          language, // Pass language to Gemini
          difficulty,
          category
        });
      }

      logger.info('Questions generated successfully for Content Studio', {
        lesson_id,
        quantity: questions.length,
        language,
        question_type
      });

      // Return response in Content Studio expected format
      res.json({
        success: true,
        questions,
        metadata: {
          lesson_id,
          course_name,
          lesson_name,
          question_type,
          language,
          quantity: questions.length,
          generated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Content Studio question generation error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        body: req.body
      });
      next(error);
    }
  },

  /**
   * Generate multiple question sets in batch
   * POST /api/content-studio/questions/batch
   */
  async generateBatchQuestions(req, res, next) {
    try {
      const { requests } = req.body;

      if (!Array.isArray(requests) || requests.length === 0) {
        return res.status(400).json({
          error: 'requests must be a non-empty array'
        });
      }

      const results = [];
      for (const request of requests) {
        try {
          // Use the same logic as single generation
          const mockReq = { body: request };
          const mockRes = {
            json: (data) => results.push({ success: true, ...data }),
            status: () => ({ json: (data) => results.push({ success: false, ...data }) })
          };

          await this.generateQuestions(mockReq, mockRes, (err) => {
            if (err) {
              results.push({
                success: false,
                error: err.message,
                request
              });
            }
          });
        } catch (error) {
          results.push({
            success: false,
            error: error.message,
            request
          });
        }
      }

      res.json({
        success: true,
        batch_size: requests.length,
        results
      });
    } catch (error) {
      logger.error('Batch question generation error:', error);
      next(error);
    }
  },

  /**
   * Health check for Content Studio integration
   * GET /api/content-studio/health
   */
  async healthCheck(req, res) {
    res.json({
      status: 'healthy',
      service: 'content-studio-integration',
      timestamp: new Date().toISOString(),
      endpoints: {
        generate: '/api/content-studio/questions/generate',
        batch: '/api/content-studio/questions/batch'
      }
    });
  }
};

export default contentStudioController;

