/**
 * Fraud Detection Controller
 * Handles fraud detection requests
 */

import fraudDetectionService from '../services/fraudDetectionService.js';
import logger from '../utils/logger.js';

const fraudController = {
  /**
   * Detect AI fraud in code submission
   * POST /api/fraud/detect
   */
  async detectFraud(req, res, next) {
    try {
      const { code, learner_id, question_id } = req.body;

      // Validate request
      if (!code || !question_id) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['code', 'question_id']
        });
      }

      // Get question context
      // TODO: Fetch from database

      const detectionResult = await fraudDetectionService.detectFraud({
        code,
        learner_id,
        question_id
      });

      // Determine action based on fraud level
      const action = this.determineAction(detectionResult.fraud_level);

      res.json({
        fraud_score: detectionResult.fraud_score,
        fraud_level: detectionResult.fraud_level,
        detection_details: detectionResult.detection_details,
        message: detectionResult.message,
        action
      });
    } catch (error) {
      logger.error('Fraud detection error:', error);
      next(error);
    }
  },

  /**
   * Determine action based on fraud level
   */
  determineAction(fraudLevel) {
    switch (fraudLevel) {
      case 'low':
        return 'proceed';
      case 'medium':
        return 'warning';
      case 'high':
        return 'restrict';
      case 'very_high':
        return 'block';
      default:
        return 'proceed';
    }
  }
};

export default fraudController;





