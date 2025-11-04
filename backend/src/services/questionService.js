/**
 * Question Service
 * Business logic for question generation and validation
 */

import geminiClient from '../clients/geminiClient.js';
import microserviceClient from '../clients/microserviceClient.js';
import supabase from '../database/supabase.js';
import logger from '../utils/logger.js';

const questionService = {
  /**
   * Generate coding questions using Gemini
   * Automatically falls back to mock data if Gemini API is unavailable
   */
  async generateCodingQuestions(params) {
    try {
      const { quantity, lesson_id, course_name, lesson_name, nano_skills, micro_skills, programming_language } = params;

      // Generate questions via Gemini (with automatic fallback to mock data)
      const questions = await geminiClient.generateQuestions({
        lesson_id,
        course_name,
        lesson_name,
        nano_skills,
        micro_skills,
        programming_language,
        quantity
      });

      // Ensure we have questions
      if (!questions || questions.length === 0) {
        logger.error('No questions generated from Gemini or mock data', { lesson_id });
        throw new Error('Failed to generate questions');
      }

      // Log if using mock data
      const isMockData = questions[0]?.source === 'mock';
      if (isMockData) {
        logger.warn('Using mock coding questions - Gemini API unavailable', {
          lesson_id,
          quantity: questions.length,
          programming_language
        });
      } else {
        logger.info('Successfully generated questions from Gemini API', {
          lesson_id,
          quantity: questions.length,
          programming_language
        });
      }

      // Notify Content Studio about question generation (only for real questions, not mock)
      if (!isMockData) {
        try {
          const questionIds = questions.map(q => q.question_id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
          await microserviceClient.notifyQuestionGeneration({
            question_ids: questionIds,
            lesson_id,
            course_name,
            quantity: questions.length,
            question_type: 'code',
            programming_language
          });
          logger.info('Content Studio notified about question generation', {
            lesson_id,
            quantity: questions.length
          });
        } catch (notificationError) {
          // Notification failure should not block question return
          logger.warn('Failed to notify Content Studio (non-blocking)', {
            error: notificationError.message,
            lesson_id
          });
        }
      }

      // Store questions in database (optional - if it fails, return questions anyway)
      try {
        const storedQuestions = await this.storeQuestions(questions, {
          lesson_id,
          programming_language,
          question_type: 'code'
        });
        
        // If storage failed and returned empty array, fallback to original questions
        if (!storedQuestions || storedQuestions.length === 0) {
          logger.warn('Database storage returned empty array, returning questions without storage', {
            lesson_id
          });
          return questions.map(q => ({
            question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            question_text: q.question_text || q.question,
            test_cases: q.test_cases || [],
            programming_language: q.programming_language || programming_language,
            style: {
              difficulty: q.difficulty || q.style?.difficulty || 'medium',
              tags: q.tags || q.style?.tags || [],
              estimated_time: q.estimated_time || q.style?.estimated_time || 15
            }
          }));
        }
        
        return storedQuestions;
      } catch (dbError) {
        logger.warn('Database storage failed, returning questions without storage', {
          message: dbError.message,
          lesson_id
        });
        // Return questions even if database storage fails
        return questions.map(q => ({
          question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question_text: q.question_text || q.question,
          test_cases: q.test_cases || [],
          programming_language: q.programming_language || programming_language,
          style: {
            difficulty: q.difficulty || q.style?.difficulty || 'medium',
            tags: q.tags || q.style?.tags || [],
            estimated_time: q.estimated_time || q.style?.estimated_time || 15
          }
        }));
      }
    } catch (error) {
      logger.error('Question generation error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Route theoretical questions to Assessment microservice
   * Automatically falls back to mock data if microservice is unavailable
   */
  async routeTheoreticalQuestions(params) {
    try {
      const questions = await microserviceClient.createTheoreticalQuestions(params);
      
      // Log if using mock data (for monitoring)
      if (questions.source === 'mock') {
        logger.warn('Using mock theoretical questions - Assessment microservice unavailable', {
          lesson_id: params.lesson_id,
          quantity: params.quantity
        });
      }
      
      return questions;
    } catch (error) {
      // This should rarely happen now since microserviceClient handles rollback
      // But keep as safety net for unexpected errors
      logger.error('Theoretical question routing error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Validate trainer-submitted question
   */
  async validateTrainerQuestion(params) {
    try {
      const { question, lesson_id, course_name, lesson_name, nano_skills, micro_skills, question_type, programming_language } = params;

      // Build validation prompt
      const prompt = `Validate the following trainer-submitted question for relevance and quality.

Question: ${question}
Course: ${course_name}
Lesson: ${lesson_name}
Nano Skills: ${nano_skills.join(', ')}
Micro Skills: ${micro_skills.join(', ')}
Question Type: ${question_type}
Programming Language: ${programming_language || 'N/A'}

Analyze:
1. Relevance to course objectives and skills
2. Question clarity and comprehensibility
3. Appropriate difficulty level
4. Code correctness (if coding question)
5. Test case completeness (if coding question)

Return validation result in JSON format:
{
  "is_valid": true,
  "relevance_score": 85,
  "quality_score": 90,
  "feedback": "...",
  "suggestions": ["..."],
  "issues": ["..."]
}`;

      // Use Gemini for validation (simplified - would use geminiClient)
      // For now, return mock structure
      const validationResult = {
        is_valid: true,
        relevance_score: 85,
        quality_score: 90,
        feedback: 'Question is relevant and well-structured',
        suggestions: ['Consider adding more edge cases'],
        issues: []
      };

      return validationResult;
    } catch (error) {
      logger.error('Question validation error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  },

  /**
   * Store questions in database
   */
  async storeQuestions(questions, metadata) {
    try {
      const storedQuestions = [];

      for (const question of questions) {
        const { data, error } = await supabase
          .from('questions')
          .insert({
            question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lesson_id: metadata.lesson_id,
            question_text: question.question_text,
            question_type: metadata.question_type,
            programming_language: metadata.programming_language,
            difficulty: question.difficulty,
            test_cases: question.test_cases,
            style: {
              tags: question.tags || [],
              estimated_time: question.estimated_time || 15
            },
            created_by: 'system',
            validation_status: 'approved'
          })
          .select()
          .single();

        if (error) {
          logger.error('Error storing question:', {
            message: error.message,
            code: error.code,
            details: error.details
          });
          continue;
        }

        storedQuestions.push({
          question_id: data.question_id,
          question_text: data.question_text,
          test_cases: data.test_cases,
          programming_language: data.programming_language,
          style: {
            difficulty: data.difficulty,
            tags: data.style.tags,
            estimated_time: data.style.estimated_time
          }
        });
      }

      return storedQuestions;
    } catch (error) {
      logger.error('Error storing questions:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      throw error;
    }
  }
};

export default questionService;



