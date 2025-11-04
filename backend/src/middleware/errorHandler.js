/**
 * Error Handler Middleware
 * Centralized error handling
 */

import logger from '../utils/logger.js';
import { config } from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    error: err.message,
    stack: config.env !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error
  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  res.status(statusCode).json({
    error: config.env === 'production' && statusCode === 500 
      ? 'Internal Server Error' 
      : message,
    ...(config.env !== 'production' && { stack: err.stack })
  });
};

export default errorHandler;



