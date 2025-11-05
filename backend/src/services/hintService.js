/**
 * Hint Service
 * Business logic for hint generation and caching
 */

import geminiClient from '../clients/geminiClient.js';
import supabase from '../database/supabase.js';
import logger from '../utils/logger.js';

const hintService = {
  /**
   * Generate all 3 hints in single API call and store in database
   */
  async generateHints(questionId, questionContext) {
    try {
      // Check if hints already exist
      const existingHints = await this.getStoredHints(questionId);
      if (existingHints && existingHints.length === 3) {
        logger.info('Hints retrieved from cache', { questionId });
        return existingHints;
      }

      // Generate all 3 hints via Gemini (single API call)
      const hints = await geminiClient.generateHints(questionId, questionContext);

      // Store hints in database
      await this.storeHints(questionId, hints);

      return hints;
    } catch (error) {
      logger.error('Hint generation service error:', error);
      throw error;
    }
  },

  /**
   * Get specific hint from database
   */
  async getHint(questionId, hintNumber) {
    try {
      const hints = await this.getStoredHints(questionId);
      
      if (!hints || hints.length === 0) {
        return null;
      }

      if (hintNumber < 1 || hintNumber > hints.length) {
        return null;
      }

      return hints[hintNumber - 1];
    } catch (error) {
      logger.error('Hint retrieval service error:', error);
      throw error;
    }
  },

  /**
   * Get stored hints from database
   */
  async getStoredHints(questionId) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('hints')
        .eq('question_id', questionId)
        .single();

      if (error || !data || !data.hints) {
        return null;
      }

      return data.hints;
    } catch (error) {
      logger.error('Error retrieving hints:', error);
      return null;
    }
  },

  /**
   * Store hints in database
   */
  async storeHints(questionId, hints) {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ hints })
        .eq('question_id', questionId);

      if (error) {
        throw error;
      }

      logger.info('Hints stored in database', { questionId });
    } catch (error) {
      logger.error('Error storing hints:', error);
      throw error;
    }
  }
};

export default hintService;




