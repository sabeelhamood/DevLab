import jwt from 'jsonwebtoken'
import { config } from '../config/environment.js'

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    })
  }

  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      })
    }
    req.user = user
    next()
  })
}

/**
 * Service authentication middleware
 * Required in production (when SERVICE_API_KEYS is set)
 * Optional in development (allows requests without auth headers)
 */
export const authenticateService = (req, res, next) => {
  const isProduction = config.nodeEnv === 'production'
  const hasServiceApiKeys = config.security.apiKeys && config.security.apiKeys.trim().length > 0
  
  // In production or when SERVICE_API_KEYS is set, require authentication
  const requireAuth = isProduction || hasServiceApiKeys
  
  if (!requireAuth) {
    // Development mode: allow requests without auth headers
    console.log('🔓 [auth] Service authentication skipped (development mode)')
    return next()
  }
  
  // Production mode: require authentication
  console.log('🔒 [auth] Service authentication required (production mode)')
  
  const apiKey = req.headers['x-api-key']
  const serviceId = req.headers['x-service-id']

  if (!apiKey || !serviceId) {
    console.error('❌ [auth] Service authentication failed: missing headers')
    console.error('   Required headers: x-api-key, x-service-id')
    console.error('   Received headers:', {
      'x-api-key': apiKey ? 'present' : 'missing',
      'x-service-id': serviceId ? 'present' : 'missing'
    })
    return res.status(401).json({ 
      success: false, 
      error: 'Service authentication required',
      message: 'Missing required headers: x-api-key, x-service-id'
    })
  }

  // Validate service API key
  const validServices = config.security.apiKeys.split(',').map(key => key.trim()).filter(key => key.length > 0)
  
  if (validServices.length === 0) {
    console.error('❌ [auth] Service authentication failed: SERVICE_API_KEYS not configured')
    return res.status(500).json({ 
      success: false, 
      error: 'Service authentication misconfigured',
      message: 'SERVICE_API_KEYS environment variable is not set'
    })
  }
  
  if (!validServices.includes(apiKey)) {
    console.error('❌ [auth] Service authentication failed: invalid API key')
    console.error('   Provided API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'missing')
    console.error('   Valid service keys count:', validServices.length)
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid service API key'
    })
  }

  console.log('✅ [auth] Service authentication successful')
  console.log('   Service ID:', serviceId)
  console.log('   API key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'missing')
  
  req.headers['service-id'] = serviceId
  req.serviceAuth = {
    authenticated: true,
    serviceId,
    apiKey: apiKey.substring(0, 8) + '...' // Log only first 8 chars
  }
  next()
}

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      })
    }

    next()
  }
}

