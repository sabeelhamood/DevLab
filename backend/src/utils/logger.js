/**
 * Logger Utility
 * Winston-based logging with MongoDB transport for production
 */

import winston from 'winston';
import { config } from '../config/environment.js';

const { createLogger, format, transports } = winston;
const { combine, timestamp, json, printf } = format;

// Safe JSON stringify that handles circular references and errors
const safeStringify = (obj) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Skip circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    
    // Handle Error objects
    if (value instanceof Error) {
      return {
        message: value.message,
        stack: value.stack,
        name: value.name,
        code: value.code
      };
    }
    
    // Handle Axios errors
    if (value && value.isAxiosError) {
      return {
        message: value.message,
        code: value.code,
        response: value.response ? {
          status: value.response.status,
          statusText: value.response.statusText,
          data: value.response.data
        } : undefined,
        request: value.request ? {
          method: value.request.method,
          path: value.request.path
        } : undefined
      };
    }
    
    return value;
  }, 2);
};

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    try {
      msg += ` ${safeStringify(metadata)}`;
    } catch (err) {
      msg += ` [Error serializing metadata: ${err.message}]`;
    }
  }
  return msg;
});

// Create logger
const logger = createLogger({
  level: config.logging.level,
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { service: 'devlab-backend' },
  transports: [
    // Write all logs to console
    new transports.Console({
      format: combine(
        format.colorize(),
        consoleFormat
      )
    }),
    // Write errors to error.log
    new transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: combine(timestamp(), json())
    }),
    // Write all logs to combined.log
    new transports.File({ 
      filename: 'logs/combined.log',
      format: combine(timestamp(), json())
    })
  ]
});

// Add MongoDB transport for production
if (config.env === 'production') {
  // MongoDB transport would be added here
  // For now, using file-based logging
  logger.info('Production logging configured');
}

export default logger;



