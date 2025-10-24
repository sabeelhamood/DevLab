import { config } from '../config/environment.js'

export const healthController = {
  async healthCheck(req, res) {
    try {
      // Mock health check - in real implementation, this would check actual services
      const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.nodeEnv,
        services: {
          database: 'connected',
          ai: 'connected',
          external: 'connected'
        },
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }

      res.status(200).json(healthStatus)
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      })
    }
  }
}

