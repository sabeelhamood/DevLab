/**
 * Authentication Middleware
 * JWT token validation and API key validation
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/environment.js';
import logger from '../utils/logger.js';

/**
 * Validate JWT token
 */
export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    jwt.verify(token, config.security.jwtSecret, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token', { error: err.message, ip: req.ip });
        return res.status(403).json({
          error: 'Invalid token',
          message: 'Token verification failed'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error'
    });
  }
};

/**
 * Validate API key for microservice communication
 */
export const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        error: 'API key required',
        message: 'No API key provided'
      });
    }

    const validKeys = config.security.microserviceApiKeys?.split(',') || [];

    if (!validKeys.includes(apiKey)) {
      logger.warn('Invalid API key', { ip: req.ip });
      return res.status(403).json({
        error: 'Invalid API key',
        message: 'API key verification failed'
      });
    }

    req.service = { apiKey };
    next();
  } catch (error) {
    logger.error('API key validation error', { error: error.message });
    res.status(500).json({
      error: 'API key validation error',
      message: 'Internal server error'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, config.security.jwtSecret, (err, decoded) => {
        if (!err) {
          req.user = decoded;
        }
      });
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};



