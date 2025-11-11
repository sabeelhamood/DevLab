import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config/environment.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'

// Import routes
import authRoutes from './routes/auth/authRoutes.js'
import questionRoutes from './routes/questions/questionRoutes.js'
import sessionRoutes from './routes/sessions/sessionRoutes.js'
import analyticsRoutes from './routes/analytics/analyticsRoutes.js'
import dataRequestRoutes from './routes/dataRequestRoutes.js'

// Gemini AI routes
import geminiRoutes from './routes/gemini.js'
import geminiTestRoutes from './routes/gemini-test.js'
import geminiQuestionRoutes from './routes/gemini-question-generation.js'

// Judge0 routes
import judge0Routes from './routes/judge0.js'
import legacyCompetitionRoutes from './routes/competitions.js'
import competitionRoutes from './routes/competitions/competitionRoutes.js'

// External service routes
import assessmentRoutes from './routes/external/assessmentRoutes.js'
import contentStudioRoutes from './routes/external/contentStudioRoutes.js'
import learningAnalyticsRoutes from './routes/external/learningAnalyticsRoutes.js'
import courseBuilderRoutes from './routes/external/courseBuilderRoutes.js'
import { initializeDatabases } from './config/initDatabase.js'

const app = express()

const logDatabaseEnvStatus = () => {
  if (config.nodeEnv !== 'development') {
    return
  }

  const envFlags = {
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    MONGO_URL: Boolean(process.env.MONGO_URL)
  }

  const status = Object.entries(envFlags)
    .map(([key, present]) => `${present ? '✅' : '⚠️'} ${key}`)
    .join('  ')

  console.log(`🔍 ENV CHECK: ${status}`)
}

logDatabaseEnvStatus()

// CORS configuration - MUST be first middleware
const allowedOrigins = [
  'https://dev-lab-phi.vercel.app', // production frontend
  'https://dev-lab-nu.vercel.app',
  'https://dev-lab-three.vercel.app',
  'https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app',
  'https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app',
  'https://dev-fm3lkx884-sabeels-projects-5df24825.vercel.app',
  'https://dev-gisy8vuij-sabeels-projects-5df24825.vercel.app',
  'http://localhost:3000', // local dev
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:5173',
  ...(config.security?.corsOrigins || [])
];

// Enhanced CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
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
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Additional CORS middleware for debugging
app.use((req, res, next) => {
  console.log('🔍 Request details:', {
    method: req.method,
    url: req.url,
    origin: req.header('Origin'),
    userAgent: req.header('User-Agent'),
    headers: req.headers
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
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    res.status(403).json({ error: 'CORS not allowed' });
  }
});


// Trust proxy for Railway deployment (required for express-rate-limit)
app.set('trust proxy', 1)

// Simple health check endpoint for Railway (before any middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

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
    headers: req.headers
  })
})

// Security middleware with CORS-friendly configuration
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan('combined'))


// API routes
app.use('/api/auth', authRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/competitions', competitionRoutes)
app.use('/api/competitions-mock', legacyCompetitionRoutes)
app.use('/api/analytics', analyticsRoutes)

// Gemini AI routes
app.use('/api/gemini', geminiRoutes)
app.use('/api/gemini-test', geminiTestRoutes)
app.use('/api/gemini-questions', geminiQuestionRoutes)
app.use('/api', dataRequestRoutes)

// Judge0 routes
app.use('/api/judge0', judge0Routes)

// External service routes (for microservice communication)
app.use('/api/external/assessment', assessmentRoutes)
app.use('/api/external/content-studio', contentStudioRoutes)
app.use('/api/external/analytics', learningAnalyticsRoutes)
app.use('/api/external/course-builder', courseBuilderRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
const HOST = '0.0.0.0'

let server

const startServer = async () => {
  try {
    await initializeDatabases()
  } catch (error) {
    console.error('❌ Database initialization failed during startup:', error)
  }

  server = app.listen(PORT, HOST, () => {
    console.log(`🚀 DEVLAB Backend running on ${HOST}:${PORT}`)
    console.log(`📊 Environment: ${config.nodeEnv}`)
    console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`)
    console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`)
    console.log(`🔧 Process.env.PORT: ${process.env.PORT}`)
    console.log(`🔧 Config.port: ${config.port}`)
  })

  server.on('error', (error) => {
    console.error('❌ Server error:', error)
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`)
    }
  })

  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully')
    server.close(() => {
      console.log('✅ Server closed')
      process.exit(0)
    })
  })
}

startServer()

export default app