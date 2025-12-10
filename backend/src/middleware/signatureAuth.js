import { verifySignature } from '../utils/signature.js'
import { config } from '../config/environment.js'

/**
 * Signature-based authentication middleware
 * Replaces X-API-Key authentication with X-Signature verification
 * Verifies requests using ECDSA P-256 signatures
 */
export const authenticateSignature = (req, res, next) => {
  const isProduction = config.nodeEnv === 'production'
  const signaturesEnabled = process.env.SIGNATURES_ENABLED !== 'false' // Default to true
  
  // In development, allow requests without signatures if signatures are disabled
  if (!isProduction && !signaturesEnabled) {
    console.log('🔓 [signature-auth] Signature verification skipped (development mode, signatures disabled)')
    return next()
  }
  
  // Production mode or signatures enabled: require signature verification
  console.log('🔒 [signature-auth] Signature verification required')
  
  const serviceName = req.headers['x-service-name']
  const signature = req.headers['x-signature']
  
  // Check required headers
  if (!serviceName || !signature) {
    console.error('❌ [signature-auth] Missing required headers')
    console.error('   Required headers: x-service-name, x-signature')
    console.error('   Received headers:', {
      'x-service-name': serviceName ? 'present' : 'missing',
      'x-signature': signature ? 'present' : 'missing'
    })
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Missing required headers: x-service-name, x-signature'
    })
  }
  
  // Get public key for this service
  // For now, we'll get coordinator's public key from env (for coordinator requests)
  // In the future, this could be loaded from a config file with all authorized services
  const coordinatorPublicKey = process.env.COORDINATOR_PUBLIC_KEY
  
  // If this is a request from coordinator, verify with coordinator's public key
  if (serviceName === 'coordinator' && coordinatorPublicKey) {
    try {
      const payload = req.body || {}
      const isValid = verifySignature(serviceName, signature, coordinatorPublicKey, payload)
      
      if (!isValid) {
        console.error('❌ [signature-auth] Invalid signature from coordinator')
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid signature'
        })
      }
      
      console.log('✅ [signature-auth] Coordinator signature verified')
      req.authenticatedService = serviceName
      req.serviceAuth = {
        authenticated: true,
        serviceName,
        verified: true
      }
      return next()
    } catch (error) {
      console.error('❌ [signature-auth] Signature verification error:', error.message)
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Signature verification failed'
      })
    }
  }
  
  // For other services, we would need their public keys
  // For now, if it's not coordinator and we don't have their public key, allow in development
  if (!isProduction) {
    console.warn('⚠️ [signature-auth] Unknown service, allowing in development mode:', serviceName)
    req.authenticatedService = serviceName
    req.serviceAuth = {
      authenticated: true,
      serviceName,
      verified: false // Not verified but allowed in dev
    }
    return next()
  }
  
  // In production, reject unknown services
  console.error('❌ [signature-auth] Unknown service in production:', serviceName)
  return res.status(401).json({
    success: false,
    error: 'Authentication failed',
    message: 'Service not authorized'
  })
}

