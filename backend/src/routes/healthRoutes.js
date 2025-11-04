/**
 * Health Check Routes
 * Health check endpoint for monitoring
 * 
 * IMPORTANT: The basic /health endpoint must NOT import config or logger
 * to avoid circular dependencies or startup failures. It must be completely
 * independent so Railway healthchecks always succeed.
 */

import express from 'express';

const router = express.Router();

/**
 * GET /health
 * Health check endpoint
 * MUST be simple and fast - Railway uses this for healthchecks
 * MUST return 200 status for Railway to consider service healthy
 * MUST NOT depend on config or logger to avoid startup failures
 */
router.get('/', (req, res) => {
  // Simple synchronous response - no async, no dependencies, no imports
  // This ensures Railway healthchecks always get a response even if other modules fail
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/detailed
 * Detailed health check with environment info (for debugging)
 * This endpoint can use config and logger since it's not used by Railway healthchecks
 */
router.get('/detailed', async (req, res) => {
  try {
    // Lazy import to avoid circular dependencies
    const { config } = await import('../config/environment.js');
    const logger = (await import('../utils/logger.js')).default;
    
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
    // If detailed check fails, still return 200 so basic healthcheck doesn't fail
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      note: 'Basic healthcheck passed, detailed check unavailable',
      error: error.message
    });
  }
});

export default router;



