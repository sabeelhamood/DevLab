import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/environment'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    organizationId: string
  }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
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
    req.user = user as any
    next()
  })
}

export const authenticateService = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string
  const serviceId = req.headers['x-service-id'] as string

  if (!apiKey || !serviceId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Service authentication required' 
    })
  }

  // Validate service API key
  const validServices = config.security.apiKeys.split(',')
  
  if (!validServices.includes(apiKey)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid service API key' 
    })
  }

  req.headers['service-id'] = serviceId
  next()
}

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
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
