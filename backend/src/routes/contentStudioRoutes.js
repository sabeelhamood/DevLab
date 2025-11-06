/**
 * Content Studio Routes
 * Dedicated routes for Content Studio integration
 * These routes are designed to receive requests from Content Studio
 * and handle question generation with full language support
 */

import express from 'express';
import contentStudioController from '../controllers/contentStudioController.js';

const router = express.Router();

/**
 * POST /api/content-studio/questions/generate
 * Main endpoint for Content Studio to request question generation
 * This is the primary integration point between Content Studio and DEVLAB
 */
router.post('/questions/generate', contentStudioController.generateQuestions);

/**
 * POST /api/content-studio/questions/batch
 * Generate multiple question sets in batch
 */
router.post('/questions/batch', contentStudioController.generateBatchQuestions);

/**
 * GET /api/content-studio/health
 * Health check endpoint for Content Studio integration
 */
router.get('/health', contentStudioController.healthCheck);

export default router;

