import { getCollections } from '../config/database.js'

export class AnalyticsModel {
  // Create analytics event
  static async create(eventData) {
    const { analytics } = getCollections()
    
    const event = {
      ...eventData,
      timestamp: new Date(),
      created_at: new Date()
    }
    
    const result = await analytics.insertOne(event)
    return { id: result.insertedId, ...event }
  }

  // Get user analytics
  static async getUserAnalytics(userId, startDate, endDate) {
    const { analytics } = getCollections()
    
    const query = {
      user_id: userId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const data = await analytics.find(query).toArray()
    
    // Aggregate by event type
    const aggregated = data.reduce((acc, event) => {
      if (!acc[event.event_type]) {
        acc[event.event_type] = 0
      }
      acc[event.event_type]++
      return acc
    }, {})
    
    return {
      total_events: data.length,
      events_by_type: aggregated,
      raw_events: data
    }
  }

  // Get course analytics
  static async getCourseAnalytics(courseId, startDate, endDate) {
    const { analytics } = getCollections()
    
    const query = {
      course_id: courseId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const data = await analytics.find(query).toArray()
    
    // Calculate metrics
    const metrics = {
      total_sessions: data.filter(e => e.event_type === 'session_start').length,
      total_completions: data.filter(e => e.event_type === 'course_complete').length,
      average_session_duration: 0,
      completion_rate: 0
    }
    
    // Calculate average session duration
    const sessions = data.filter(e => e.event_type === 'session_end')
    if (sessions.length > 0) {
      const totalDuration = sessions.reduce((sum, session) => {
        return sum + (session.duration || 0)
      }, 0)
      metrics.average_session_duration = totalDuration / sessions.length
    }
    
    // Calculate completion rate
    if (metrics.total_sessions > 0) {
      metrics.completion_rate = (metrics.total_completions / metrics.total_sessions) * 100
    }
    
    return {
      course_id: courseId,
      period: { start: startDate, end: endDate },
      metrics,
      raw_events: data
    }
  }

  // Get system analytics
  static async getSystemAnalytics(startDate, endDate) {
    const { analytics } = getCollections()
    
    const query = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    const data = await analytics.find(query).toArray()
    
    // Aggregate system metrics
    const systemMetrics = {
      total_events: data.length,
      unique_users: new Set(data.map(e => e.user_id)).size,
      events_by_type: {},
      hourly_distribution: {},
      daily_distribution: {}
    }
    
    // Process events
    data.forEach(event => {
      // Events by type
      if (!systemMetrics.events_by_type[event.event_type]) {
        systemMetrics.events_by_type[event.event_type] = 0
      }
      systemMetrics.events_by_type[event.event_type]++
      
      // Hourly distribution
      const hour = new Date(event.timestamp).getHours()
      if (!systemMetrics.hourly_distribution[hour]) {
        systemMetrics.hourly_distribution[hour] = 0
      }
      systemMetrics.hourly_distribution[hour]++
      
      // Daily distribution
      const day = new Date(event.timestamp).toISOString().split('T')[0]
      if (!systemMetrics.daily_distribution[day]) {
        systemMetrics.daily_distribution[day] = 0
      }
      systemMetrics.daily_distribution[day]++
    })
    
    return {
      period: { start: startDate, end: endDate },
      metrics: systemMetrics,
      raw_events: data
    }
  }
}


