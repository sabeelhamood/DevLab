/* eslint-disable no-console */
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '../config/environment.js';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Rate limiting middleware
export const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
  });
};

// General API rate limiting
export const apiRateLimit = createRateLimit(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'Too many requests from this IP, please try again later.'
);

// Authentication rate limiting
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

// Submission rate limiting
export const submissionRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 submissions
  'Too many submissions, please slow down.'
);

// Input sanitization middleware
export const sanitizeInput = (req, res, next) => {
  const sanitize = obj => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (Object.hasOwn(obj, key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// SQL injection prevention
export const preventSQLInjection = (req, res, next) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+['"]\s*=\s*['"])/gi,
    /(\bUNION\s+SELECT\b)/gi,
    /(\bSELECT\s+.*\s+FROM\b)/gi,
    /(\bINSERT\s+INTO\b)/gi,
    /(\bUPDATE\s+.*\s+SET\b)/gi,
    /(\bDELETE\s+FROM\b)/gi,
  ];

  const checkInput = input => {
    if (typeof input === 'string') {
      return dangerousPatterns.some(pattern => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some(checkInput);
    }
    if (input && typeof input === 'object') {
      return Object.values(input).some(checkInput);
    }
    return false;
  };

  const hasDangerousInput =
    checkInput(req.body) || checkInput(req.query) || checkInput(req.params);

  if (hasDangerousInput) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected',
    });
  }

  next();
};

// XSS prevention
export const preventXSS = (req, res, next) => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  ];

  const checkXSS = input => {
    if (typeof input === 'string') {
      return xssPatterns.some(pattern => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some(checkXSS);
    }
    if (input && typeof input === 'object') {
      return Object.values(input).some(checkXSS);
    }
    return false;
  };

  const hasXSS =
    checkXSS(req.body) || checkXSS(req.query) || checkXSS(req.params);

  if (hasXSS) {
    return res.status(400).json({
      success: false,
      error: 'Potentially malicious input detected',
    });
  }

  next();
};

// Request size limiting
export const requestSizeLimit = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const contentLength = parseInt(req.headers['content-length'] || '0');

  if (contentLength > maxSize) {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large',
    });
  }

  next();
};

// Security logging middleware
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
    };

    // Log security events
    if (res.statusCode >= 400) {
      console.warn('Security Event:', logData);
    }

    // Log suspicious activity
    if (duration > 5000 || res.statusCode === 429) {
      console.warn('Suspicious Activity:', logData);
    }

    return originalSend.call(this, data);
  };

  next();
};

// CORS configuration
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (config.security.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Service-ID',
  ],
};
