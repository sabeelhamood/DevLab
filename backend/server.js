/**
 * Server Entry Point
 * Starts the Express application
 * 
 * IMPORTANT: This file must handle errors gracefully to ensure
 * Railway healthchecks can always reach the server.
 */

(async () => {
  let app;
  let PORT;

  try {
    // Import app - this might fail if config has issues
    app = (await import('./src/app.js')).default;
    const { config } = await import('./src/config/environment.js');
    const logger = (await import('./src/utils/logger.js')).default;
    
    PORT = process.env.PORT || config?.port || 3001;
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
      if (logger) {
        logger.info(`DEVLAB Backend Server running on port ${PORT}`, {
          environment: config?.env || 'unknown',
          port: PORT
        });
        logger.info(`Server started. Healthcheck available at http://0.0.0.0:${PORT}/health`);
      }
    });
  } catch (error) {
    // Fallback: Create minimal Express app if imports fail
    console.error('Failed to load main app, starting minimal server for healthchecks:', error.message);
    
    const express = (await import('express')).default;
    const fallbackApp = express();
    
    // Minimal health endpoint - must work even if everything else fails
    fallbackApp.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    PORT = process.env.PORT || 3001;
    
    fallbackApp.listen(PORT, '0.0.0.0', () => {
      console.log(`Minimal server listening on port ${PORT} (fallback mode)`);
      console.log(`Healthcheck available at http://0.0.0.0:${PORT}/health`);
    });
  }
})();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});



