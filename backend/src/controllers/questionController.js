/**
 * Question Controller
 * Handles question generation and validation requests
 */

import questionService from '../services/questionService.js';
import logger from '../utils/logger.js';

const questionController = {
  /**
   * Generate practice questions
   * POST /api/questions/generate
   */
  async generateQuestions(req, res, next) {
    try {
      const {
        quantity,
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        question_type,
        programming_language
      } = req.body;

      // Validate request
      if (!lesson_id || !course_name || !lesson_name || !nano_skills || !micro_skills || !question_type || !programming_language) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['lesson_id', 'course_name', 'lesson_name', 'nano_skills', 'micro_skills', 'question_type', 'programming_language']
        });
      }

      // If theoretical, route to Assessment
      if (question_type === 'theoretical') {
        const questions = await questionService.routeTheoreticalQuestions(req.body);
        return res.json({
          success: true,
          questions
        });
      }

      // Generate coding questions
      const questions = await questionService.generateCodingQuestions({
        quantity: quantity || 4,
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        programming_language
      });

      logger.info('Questions generated successfully', {
        quantity: questions.length,
        lesson_id
      });

      res.json({
        success: true,
        questions
      });
    } catch (error) {
      logger.error('Question generation error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      next(error);
    }
  },

  /**
   * Validate trainer-submitted question
   * POST /api/questions/validate
   */
  async validateQuestion(req, res, next) {
    try {
      const {
        question,
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        question_type,
        programming_language
      } = req.body;

      // Validate request
      if (!question || !lesson_id || !course_name || !lesson_name || !nano_skills || !micro_skills || !question_type) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      const validationResult = await questionService.validateTrainerQuestion({
        question,
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        question_type,
        programming_language
      });

      res.json(validationResult);
    } catch (error) {
      logger.error('Question validation error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      next(error);
    }
  }
};

export default questionController;



