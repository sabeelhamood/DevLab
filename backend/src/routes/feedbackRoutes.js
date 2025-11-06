/**
 * Feedback Routes
 * Routes for AI-generated feedback and hints
 */

import express from 'express';
import feedbackController from '../controllers/feedbackController.js';
import hintController from '../controllers/hintController.js';

const router = express.Router();

/**
 * POST /api/feedback/generate
 * Generate AI feedback for solution
 */
router.post('/generate', feedbackController.generateFeedback);

/**
 * POST /api/feedback/hints/generate
 * Generate all 3 hints for a question (single API call)
 */
router.post('/hints/generate', hintController.generateHints);

/**
 * GET /api/feedback/hints/:questionId/:hintNumber
 * Retrieve specific hint (from cache)
 */
router.get('/hints/:questionId/:hintNumber', hintController.getHint);

export default router;





