interface Config {
  nodeEnv: string
  port: number
  database: {
    supabase: {
      url: string
      serviceKey: string
    }
    mongodb: {
      uri: string
    }
  }
  externalServices: {
    directory: string
    assessment: string
    contentStudio: string
    learningAnalytics: string
    hrReporting: string
    corporateAssistant: string
  }
  ai: {
    gemini: {
      apiKey: string
    }
    sandbox: {
      apiKey: string
      url: string
    }
  }
  security: {
    jwtSecret: string
    apiKeys: string
    corsOrigins: string[]
  }
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
}

const getEnvironmentConfig = (): Config => {
  const nodeEnv = process.env.NODE_ENV || 'development'
  
  return {
    nodeEnv,
    port: parseInt(process.env.PORT || '3001'),
    database: {
      supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
      },
      mongodb: {
        uri: process.env.MONGODB_ATLAS_URI || '',
      },
    },
    externalServices: {
      directory: process.env.DIRECTORY_SERVICE_URL || '',
      assessment: process.env.ASSESSMENT_SERVICE_URL || '',
      contentStudio: process.env.CONTENT_STUDIO_URL || '',
      learningAnalytics: process.env.LEARNING_ANALYTICS_URL || '',
      hrReporting: process.env.HR_REPORTING_URL || '',
      corporateAssistant: process.env.CORPORATE_ASSISTANT_URL || '',
    },
    ai: {
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
      },
      sandbox: {
        apiKey: process.env.SANDBOX_API_KEY || '',
        url: process.env.SANDBOX_API_URL || '',
      },
    },
    security: {
      jwtSecret: process.env.SERVICE_JWT_SECRET || 'dev-secret-key',
      apiKeys: process.env.SERVICE_API_KEYS || '',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  }
}

export const config = getEnvironmentConfig()
