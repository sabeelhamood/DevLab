/**
 * Server Entry Point
 * Starts the Express application
 */

import app from './src/app.js';
import { config } from './src/config/environment.js';
import logger from './src/utils/logger.js';

const PORT = config.port;

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`DEVLAB Backend Server running on port ${PORT}`, {
    environment: config.env,
    port: PORT
  });
  logger.info(`Server started. Healthcheck available at http://0.0.0.0:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});



