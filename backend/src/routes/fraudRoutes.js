/**
 * Fraud Detection Routes
 * Routes for AI fraud detection
 */

import express from 'express';
import fraudController from '../controllers/fraudController.js';

const router = express.Router();

/**
 * POST /api/fraud/detect
 * Detect AI fraud in code submission
 */
router.post('/detect', fraudController.detectFraud);

export default router;




