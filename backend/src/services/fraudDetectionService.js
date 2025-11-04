/**
 * Fraud Detection Service
 * Business logic for AI fraud detection
 */

import geminiClient from '../clients/geminiClient.js';
import supabase from '../database/supabase.js';
import logger from '../utils/logger.js';

const fraudDetectionService = {
  /**
   * Detect AI fraud in code submission
   */
  async detectFraud(params) {
    try {
      const { code, learner_id, question_id } = params;

      // Get question context from database
      const { data: question, error } = await supabase
        .from('questions')
        .select('question_text, programming_language')
        .eq('question_id', question_id)
        .single();

      if (error || !question) {
        throw new Error('Question not found');
      }

      const questionContext = {
        question_text: question.question_text,
        programming_language: question.programming_language
      };

      // Detect fraud via Gemini
      const detectionResult = await geminiClient.detectFraud(code, questionContext);

      // Store fraud score in submissions table (not a separate incidents table)
      // This would be done when submission is saved

      logger.info('Fraud detection completed', {
        question_id,
        fraud_score: detectionResult.fraud_score,
        fraud_level: detectionResult.fraud_level
      });

      return detectionResult;
    } catch (error) {
      logger.error('Fraud detection service error:', error);
      throw error;
    }
  }
};

export default fraudDetectionService;



