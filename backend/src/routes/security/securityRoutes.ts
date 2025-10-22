import express from 'express'
import { authenticateToken, requireRole } from '../../middleware/auth'
import { securityAuditService } from '../../services/security/auditService'

const router = express.Router()

// All security routes require admin authentication
router.use(authenticateToken)
router.use(requireRole(['admin']))

// Get security metrics
router.get('/metrics', (req, res) => {
  try {
    const { start, end } = req.query
    const timeRange = start && end ? { start: start as string, end: end as string } : undefined
    
    const metrics = securityAuditService.getSecurityMetrics(timeRange)
    
    res.json({
      success: true,
      data: metrics
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get recent security events
router.get('/events', (req, res) => {
  try {
    const { limit = 100, type, severity } = req.query
    
    let events = securityAuditService.getRecentEvents(Number(limit))
    
    if (type) {
      events = events.filter(event => event.type === type)
    }
    
    if (severity) {
      events = events.filter(event => event.severity === severity)
    }
    
    res.json({
      success: true,
      data: events
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get events by severity
router.get('/events/severity/:severity', (req, res) => {
  try {
    const { severity } = req.params
    
    if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid severity level'
      })
    }
    
    const events = securityAuditService.getEventsBySeverity(severity as any)
    
    res.json({
      success: true,
      data: events
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get events by type
router.get('/events/type/:type', (req, res) => {
  try {
    const { type } = req.params
    
    if (!['authentication', 'authorization', 'input_validation', 'rate_limit', 'suspicious_activity'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type'
      })
    }
    
    const events = securityAuditService.getEventsByType(type as any)
    
    res.json({
      success: true,
      data: events
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get security dashboard data
router.get('/dashboard', (req, res) => {
  try {
    const metrics = securityAuditService.getSecurityMetrics()
    const recentEvents = securityAuditService.getRecentEvents(50)
    const criticalEvents = securityAuditService.getEventsBySeverity('critical')
    const highSeverityEvents = securityAuditService.getEventsBySeverity('high')
    
    const dashboard = {
      overview: {
        totalEvents: metrics.totalEvents,
        criticalEvents: criticalEvents.length,
        highSeverityEvents: highSeverityEvents.length,
        last24Hours: metrics.eventsByType
      },
      recentActivity: recentEvents.slice(0, 10),
      topThreats: {
        topIPs: metrics.topIPs.slice(0, 5),
        topUserAgents: metrics.topUserAgents.slice(0, 5)
      },
      eventDistribution: {
        byType: metrics.eventsByType,
        bySeverity: metrics.eventsBySeverity
      }
    }
    
    res.json({
      success: true,
      data: dashboard
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
