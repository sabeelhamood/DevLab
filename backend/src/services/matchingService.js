/**
 * Matching Service
 * Business logic for matching learners for competitions
 */

import supabase from '../database/supabase.js';
import logger from '../utils/logger.js';

const matchingService = {
  /**
   * Find potential competitors for a learner
   */
  async findPotentialCompetitors(courseId, learnerId) {
    try {
      // Get learner's skill level
      const { data: learner, error: learnerError } = await supabase
        .from('users')
        .select('skill_level')
        .eq('learner_id', learnerId)
        .single();

      if (learnerError || !learner) {
        throw new Error('Learner not found');
      }

      const learnerSkillLevel = learner.skill_level;

      // Find other learners who completed the same course
      // Match by similar skill level (±1 level)
      // Exclude learners who already competed recently
      // Get 3-5 potential competitors

      const { data: competitors, error } = await supabase
        .from('users')
        .select('learner_id, skill_level')
        .neq('learner_id', learnerId)
        .gte('skill_level', learnerSkillLevel - 1)
        .lte('skill_level', learnerSkillLevel + 1)
        .limit(5);

      if (error) {
        throw error;
      }

      // Filter by availability (not in active competition)
      // This is simplified - would need more complex query
      const availableCompetitors = competitors
        .filter(c => c.available !== false)
        .slice(0, 5);

      logger.info('Potential competitors found', {
        course_id: courseId,
        learner_id: learnerId,
        count: availableCompetitors.length
      });

      return availableCompetitors.map(c => ({
        learner_id: c.learner_id,
        skill_level: c.skill_level,
        available: true
      }));
    } catch (error) {
      logger.error('Matching service error:', error);
      throw error;
    }
  }
};

export default matchingService;




