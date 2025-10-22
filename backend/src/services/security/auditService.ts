import { Request } from 'express'
import { config } from '../../config/environment'

export interface SecurityEvent {
  id: string
  type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  userId?: string
  ip: string
  userAgent: string
  timestamp: string
  metadata: Record<string, any>
}

export interface SecurityMetrics {
  totalEvents: number
  eventsByType: Record<string, number>
  eventsBySeverity: Record<string, number>
  topIPs: Array<{ ip: string; count: number }>
  topUserAgents: Array<{ userAgent: string; count: number }>
  timeRange: {
    start: string
    end: string
  }
}

class SecurityAuditService {
  private events: SecurityEvent[] = []
  private readonly maxEvents = 10000

  logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event
    }

    this.events.push(securityEvent)

    // Maintain event limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console for development
    if (config.nodeEnv === 'development') {
      console.log('Security Event:', securityEvent)
    }

    // Send to external security monitoring (in production)
    if (config.nodeEnv === 'production') {
      this.sendToSecurityMonitoring(securityEvent)
    }
  }

  logAuthenticationEvent(req: Request, success: boolean, userId?: string): void {
    this.logEvent({
      type: 'authentication',
      severity: success ? 'low' : 'medium',
      message: success ? 'Successful authentication' : 'Failed authentication attempt',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      metadata: {
        success,
        endpoint: req.path,
        method: req.method
      }
    })
  }

  logAuthorizationEvent(req: Request, success: boolean, userId?: string, resource?: string): void {
    this.logEvent({
      type: 'authorization',
      severity: success ? 'low' : 'high',
      message: success ? 'Authorized access' : 'Unauthorized access attempt',
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      metadata: {
        success,
        endpoint: req.path,
        method: req.method,
        resource
      }
    })
  }

  logInputValidationEvent(req: Request, validationType: string, details: string): void {
    this.logEvent({
      type: 'input_validation',
      severity: 'medium',
      message: `Input validation failed: ${validationType}`,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      metadata: {
        validationType,
        details,
        endpoint: req.path,
        method: req.method,
        body: this.sanitizeRequestBody(req.body)
      }
    })
  }

  logRateLimitEvent(req: Request, limitType: string, attempts: number): void {
    this.logEvent({
      type: 'rate_limit',
      severity: 'medium',
      message: `Rate limit exceeded: ${limitType}`,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      metadata: {
        limitType,
        attempts,
        endpoint: req.path,
        method: req.method
      }
    })
  }

  logSuspiciousActivity(req: Request, activityType: string, details: string): void {
    this.logEvent({
      type: 'suspicious_activity',
      severity: 'high',
      message: `Suspicious activity detected: ${activityType}`,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown',
      metadata: {
        activityType,
        details,
        endpoint: req.path,
        method: req.method,
        headers: this.sanitizeHeaders(req.headers)
      }
    })
  }

  getSecurityMetrics(timeRange?: { start: string; end: string }): SecurityMetrics {
    const filteredEvents = timeRange 
      ? this.events.filter(event => 
          event.timestamp >= timeRange.start && 
          event.timestamp <= timeRange.end
        )
      : this.events

    const eventsByType = filteredEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const eventsBySeverity = filteredEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const ipCounts = filteredEvents.reduce((acc, event) => {
      acc[event.ip] = (acc[event.ip] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const userAgentCounts = filteredEvents.reduce((acc, event) => {
      acc[event.userAgent] = (acc[event.userAgent] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const topIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const topUserAgents = Object.entries(userAgentCounts)
      .map(([userAgent, count]) => ({ userAgent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalEvents: filteredEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      topUserAgents,
      timeRange: timeRange || {
        start: this.events[0]?.timestamp || new Date().toISOString(),
        end: this.events[this.events.length - 1]?.timestamp || new Date().toISOString()
      }
    }
  }

  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  getEventsBySeverity(severity: SecurityEvent['severity']): SecurityEvent[] {
    return this.events.filter(event => event.severity === severity)
  }

  getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type)
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return body
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key']
    const sanitized = { ...body }
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers }
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    }
    
    return sanitized
  }

  private async sendToSecurityMonitoring(event: SecurityEvent): Promise<void> {
    try {
      // In production, send to external security monitoring service
      // This could be Sentry, DataDog, or a custom security dashboard
      console.log('Sending to security monitoring:', event.id)
    } catch (error) {
      console.error('Failed to send security event to monitoring:', error)
    }
  }
}

export const securityAuditService = new SecurityAuditService()
