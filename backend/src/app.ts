import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { config } from './config/environment'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'

// Import routes
import authRoutes from './routes/auth/authRoutes'
import questionRoutes from './routes/questions/questionRoutes'
import sessionRoutes from './routes/sessions/sessionRoutes'
import competitionRoutes from './routes/competitions/competitionRoutes'
import analyticsRoutes from './routes/analytics/analyticsRoutes'
import healthRoutes from './routes/health/healthRoutes'

// External service routes
import directoryRoutes from './routes/external/directoryRoutes'
import assessmentRoutes from './routes/external/assessmentRoutes'
import contentStudioRoutes from './routes/external/contentStudioRoutes'
import learningAnalyticsRoutes from './routes/external/learningAnalyticsRoutes'
import hrReportingRoutes from './routes/external/hrReportingRoutes'
import assistantRoutes from './routes/external/assistantRoutes'

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
