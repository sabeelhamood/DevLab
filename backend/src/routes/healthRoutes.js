/**
 * Health Check Routes
 * Health check endpoint for monitoring
 */

import express from 'express';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 */
router.get('/', async (req, res) => {
  try {
    // Check environment variables status (without exposing values)
    const envStatus = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? {
        exists: true,
        length: process.env.GEMINI_API_KEY.length,
        prefix: process.env.GEMINI_API_KEY.substring(0, 10) + '...',
        isPlaceholder: process.env.GEMINI_API_KEY.includes('your-gemini') || process.env.GEMINI_API_KEY.length < 20
      } : { exists: false },
      X_RAPIDAPI_KEY: process.env.X_RAPIDAPI_KEY ? {
        exists: true,
        length: process.env.X_RAPIDAPI_KEY.length,
        prefix: process.env.X_RAPIDAPI_KEY.substring(0, 10) + '...'
      } : { exists: false },
      SUPABASE_URL: process.env.SUPABASE_URL ? { exists: true } : { exists: false },
      MONGO_URL: process.env.MONGO_URL ? { exists: true } : { exists: false }
    };

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.env,
      environmentVariables: envStatus,
      services: {
        database: 'connected', // TODO: Add actual database health check
        gemini: envStatus.GEMINI_API_KEY.exists && !envStatus.GEMINI_API_KEY.isPlaceholder ? 'configured' : 'not configured',
        judge0: envStatus.X_RAPIDAPI_KEY.exists ? 'configured' : 'not configured'
      }
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

export default router;



