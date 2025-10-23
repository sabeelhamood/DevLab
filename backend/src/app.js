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
import authRoutes from '../dist/routes/auth/authRoutes.js'
import questionRoutes from '../dist/routes/questions/questionRoutes.js'
import sessionRoutes from '../dist/routes/sessions/sessionRoutes.js'
import competitionRoutes from '../dist/routes/competitions/competitionRoutes.js'
import analyticsRoutes from '../dist/routes/analytics/analyticsRoutes.js'
import healthRoutes from '../dist/routes/health/healthRoutes.js'

// Gemini AI routes
import geminiRoutes from './routes/gemini.js'
import geminiTestRoutes from './routes/gemini-test.js'

// External service routes
import directoryRoutes from '../dist/routes/external/directoryRoutes.js'
import assessmentRoutes from '../dist/routes/external/assessmentRoutes.js'
import contentStudioRoutes from '../dist/routes/external/contentStudioRoutes.js'
import learningAnalyticsRoutes from '../dist/routes/external/learningAnalyticsRoutes.js'
import hrReportingRoutes from '../dist/routes/external/hrReportingRoutes.js'
import assistantRoutes from '../dist/routes/external/assistantRoutes.js'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({
  origin: config.corsOrigins,
  credentials: true
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

// Health check
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/competitions', competitionRoutes)
app.use('/api/analytics', analyticsRoutes)

// Gemini AI routes
app.use('/api/gemini', geminiRoutes)
app.use('/api/gemini-test', geminiTestRoutes)

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
const PORT = config.port || 3001
app.listen(PORT, () => {
  console.log(`🚀 DEVLAB Backend running on port ${PORT}`)
  console.log(`📊 Environment: ${config.nodeEnv}`)
  console.log(`🔗 API Base URL: http://localhost:${PORT}/api`)
})

export default app