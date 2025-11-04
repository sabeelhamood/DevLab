/**
 * Express Application Setup
 * Main application configuration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import logger from './utils/logger.js';
import errorHandler from './middleware/errorHandler.js';

// Import routes
import questionRoutes from './routes/questionRoutes.js';
import codeExecutionRoutes from './routes/codeExecutionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import competitionRoutes from './routes/competitionRoutes.js';
import fraudRoutes from './routes/fraudRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();

// Health check route - must be BEFORE security middleware for Railway healthchecks
// Railway healthchecks come from healthcheck.railway.app and must be accessible
app.use('/health', healthRoutes);

// Security middleware
app.use(helmet());

// CORS configuration - allow Railway healthcheck hostname
const corsOrigins = [
  ...config.security.corsOrigins,
  'https://healthcheck.railway.app', // Railway healthcheck hostname
  'http://healthcheck.railway.app'  // Railway healthcheck hostname (fallback)
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Railway healthchecks)
    if (!origin) return callback(null, true);
    
    // Allow Railway healthcheck hostname
    if (origin.includes('healthcheck.railway.app')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - exclude health endpoint
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => req.path === '/health' // Skip rate limiting for health checks
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/code', codeExecutionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/fraud', fraudRoutes);
// Note: /health route is registered above, before security middleware

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DEVLAB Microservice API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;

