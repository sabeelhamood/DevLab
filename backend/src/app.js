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

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
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
app.use('/health', healthRoutes);

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

