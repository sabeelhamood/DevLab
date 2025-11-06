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

// CRITICAL: Register health endpoint FIRST and as a simple inline handler
// This ensures Railway healthchecks work even if healthRoutes import fails
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Also register healthRoutes for detailed health info (if it loads successfully)
// This is a fallback in case the inline handler above doesn't work
try {
  app.use('/health', healthRoutes);
} catch (error) {
  // If healthRoutes fails to load, the inline handler above will still work
  console.warn('Health routes failed to load, using inline handler:', error.message);
}

// Security middleware - configure Helmet to allow healthchecks
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for healthchecks
  crossOriginEmbedderPolicy: false // Allow Railway healthchecks
}));

// CORS configuration - allow Railway healthcheck hostname
// Use try-catch to handle config errors gracefully
let corsOrigins = [
  'https://healthcheck.railway.app', // Railway healthcheck hostname
  'http://healthcheck.railway.app',  // Railway healthcheck hostname (fallback)
  'https://dev-lab-mocha.vercel.app',  // Vercel production deployment
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001'
];

try {
  if (config?.security?.corsOrigins) {
    corsOrigins = [...corsOrigins, ...config.security.corsOrigins];
  }
} catch (error) {
  console.warn('Could not load CORS config, using defaults:', error.message);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Railway healthchecks)
    if (!origin) return callback(null, true);
    
    // Allow Railway healthcheck hostname
    if (origin.includes('healthcheck.railway.app')) {
      return callback(null, true);
    }
    
    // Allow all Vercel deployments (production and preview)
    if (origin.includes('.vercel.app') || origin === 'https://dev-lab-mocha.vercel.app') {
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

