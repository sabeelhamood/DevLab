/* eslint-disable no-console */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localEnvPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

// Import routes
import healthRoutes from './routes/health/healthRoutes.js';
import practiceRoutes from './routes/practices/practiceRoutes.js';
import competitionRoutes from './routes/competitions/competitionRoutes.js';
import trainerRoutes from './routes/contentStudio/trainerRoutes.js';

const app = express();

// CORS configuration - MUST be first middleware
const allowedOrigins = [
  'http://localhost:3000', // local dev
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173',
  ...(config.security?.corsOrigins || []),
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🌐 CORS: Request from origin:', origin);

    // Allow requests with no origin (like Postman, mobile apps, curl)
    if (!origin) {
      console.log('✅ CORS: No origin, allowing');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      return callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed:', origin);
      console.log('📋 CORS: Allowed origins:', allowedOrigins);
      return callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));

// Additional CORS middleware for debugging
app.use((req, res, next) => {
  console.log('🔍 Request details:', {
    method: req.method,
    url: req.url,
    origin: req.header('Origin'),
    userAgent: req.header('User-Agent'),
    headers: req.headers,
  });
  next();
});

// Handle preflight requests explicitly for all routes
app.options('*', (req, res) => {
  console.log('🔄 CORS: Handling preflight request for:', req.url);
  console.log('🌐 CORS: Preflight origin:', req.header('Origin'));

  const origin = req.header('Origin');
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS, PATCH'
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, Origin'
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    res.status(403).json({ error: 'CORS not allowed' });
  }
});

// Trust proxy for Railway deployment (required for express-rate-limit)
app.set('trust proxy', 1);

// Simple health check endpoint for Railway (before any middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  console.log('🧪 CORS Test: Request received');
  console.log('🌐 CORS Test: Origin:', req.header('Origin'));
  console.log('🌐 CORS Test: Headers:', req.headers);

  res.status(200).json({
    success: true,
    message: 'CORS test successful',
    origin: req.header('Origin'),
    timestamp: new Date().toISOString(),
    headers: req.headers,
  });
});

// Security middleware with CORS-friendly configuration
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/content', trainerRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend running on ${HOST}:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`);
  console.log(`🔧 Process.env.PORT: ${process.env.PORT}`);
  console.log(`🔧 Config.port: ${config.port}`);
});

// Handle server errors
server.on('error', error => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;
