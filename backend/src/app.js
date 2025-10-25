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
import healthRoutes from './routes/health/healthRoutes.js'

// Gemini AI routes
import geminiRoutes from './routes/gemini.js'
import geminiTestRoutes from './routes/gemini-test.js'
import geminiQuestionRoutes from './routes/gemini-question-generation.js'

// Judge0 routes
import judge0Routes from './routes/judge0.js'
// import competitionRoutes from './routes/competitions.js'

// External service routes
import directoryRoutes from './routes/external/directoryRoutes.js'
import assessmentRoutes from './routes/external/assessmentRoutes.js'
import contentStudioRoutes from './routes/external/contentStudioRoutes.js'
import learningAnalyticsRoutes from './routes/external/learningAnalyticsRoutes.js'
import hrReportingRoutes from './routes/external/hrReportingRoutes.js'
import assistantRoutes from './routes/external/assistantRoutes.js'

const app = express()

// Simple health check endpoint for Railway (before any middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: config.nodeEnv === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:5173']
    : [
        'https://dev-lab-phi.vercel.app',
        'https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app',
        'https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app',
        'healthcheck.railway.app',
        ...(config.security.corsOrigins || [])
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  optionsSuccessStatus: 200
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
// app.use('/api/competitions', competitionRoutes)
app.use('/api/analytics', analyticsRoutes)

// Gemini AI routes
app.use('/api/gemini', geminiRoutes)
app.use('/api/gemini-test', geminiTestRoutes)
app.use('/api/gemini-questions', geminiQuestionRoutes)

// Judge0 routes
app.use('/api/judge0', judge0Routes)

// External service routes (for microservice communication)
app.use('/api/external/learners', directoryRoutes)
app.use('/api/external/questions', assessmentRoutes)
app.use('/api/external/content', contentStudioRoutes)
app.use('/api/external/analytics', learningAnalyticsRoutes)
app.use('/api/external/hr', hrReportingRoutes)
app.use('/api/external/assistant', assistantRoutes)

// Error handling middleware
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3000
const HOST = '0.0.0.0'

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 DEVLAB Backend running on ${HOST}:${PORT}`)
  console.log(`📊 Environment: ${config.nodeEnv}`)
  console.log(`🔗 API Base URL: http://${HOST}:${PORT}/api`)
  console.log(`🏥 Health Check: http://${HOST}:${PORT}/health`)
  console.log(`🔧 Process.env.PORT: ${process.env.PORT}`)
  console.log(`🔧 Config.port: ${config.port}`)
})

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error)
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`)
  }
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('✅ Server closed')
    process.exit(0)
  })
})

export default app