/**
 * Question Routes
 * Routes for question generation and validation
 */

import express from 'express';
import questionController from '../controllers/questionController.js';

const router = express.Router();

/**
 * POST /api/questions/generate
 * Generate practice questions
 */
router.post('/generate', questionController.generateQuestions);

/**
 * POST /api/questions/validate
 * Validate trainer-submitted question
 */
router.post('/validate', questionController.validateQuestion);

export default router;




