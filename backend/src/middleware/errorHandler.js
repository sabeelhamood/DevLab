import { config } from '../config/environment.js'

export const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error with detailed information
  console.error('\n' + '='.repeat(80))
  console.error('❌ [ERROR-HANDLER] Error caught in error handler middleware')
  console.error('='.repeat(80))
  console.error('   Error name:', err.name || 'N/A')
  console.error('   Error message:', err.message || 'N/A')
  console.error('   Error code:', err.code || 'N/A')
  console.error('   Error type:', typeof err)
  console.error('   Request URL:', req.url || 'N/A')
  console.error('   Request originalUrl:', req.originalUrl || 'N/A')
  console.error('   Request method:', req.method || 'N/A')
  console.error('   Request IP:', req.ip || 'N/A')
  console.error('   Request path:', req.path || 'N/A')
  console.error('   User Agent:', req.get('User-Agent') || 'N/A')
  if (err.stack) {
    console.error('   Error stack:', err.stack)
  }
  console.error('='.repeat(80) + '\n')

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = { name: 'CastError', message, statusCode: 404 }
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = { name: 'MongoError', message, statusCode: 400 }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ')
    error = { name: 'ValidationError', message, statusCode: 400 }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = { name: 'JsonWebTokenError', message, statusCode: 401 }
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = { name: 'TokenExpiredError', message, statusCode: 401 }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  })
}

