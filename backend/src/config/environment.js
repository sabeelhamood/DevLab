const getEnvironmentConfig = () => {
  const nodeEnv = process.env['NODE_ENV'] || 'development'
  
  return {
    nodeEnv,
    port: parseInt(process.env['PORT'] || '3000'),
    database: {
      supabase: {
        url: process.env['SUPABASE_URL'] || '',
      },
      mongodb: {
        uri: process.env['MONGO_URL'] || '',
      },
    },
    externalServices: {
      assessment: process.env['ASSESSMENT_SERVICE_URL'] || '',
      contentStudio: process.env['CONTENT_STUDIO_URL'] || '',
      learningAnalytics: process.env['LEARNING_ANALYTICS_URL'] || '',
      courseBuilder: process.env['COURSE_BUILDER_URL'] || '',
    },
    ai: {
      gemini: {
        apiKey: process.env['GEMINI_API_KEY'] || '',
      },
      openai: {
        apiKey: process.env['OPENAI_API_KEY'] || '',
      },
      sandbox: {
        apiKey: process.env['SANDBOX_API_KEY'] || '',
        url: process.env['SANDBOX_API_URL'] || '',
      },
    },
    security: {
      jwtSecret: process.env['SERVICE_JWT_SECRET'] || 'dev-secret-key',
      apiKeys: process.env['SERVICE_API_KEYS'] || '',
      corsOrigins: process.env['CORS_ORIGINS']?.split(',') ||
        [
          'https://dev-lab-phi.vercel.app',
          'https://dev-lab-nu.vercel.app',
          'https://dev-lab-three.vercel.app',
          'https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app',
          'https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app',
          'https://dev-fm3lkx884-sabeels-projects-5df24825.vercel.app',
          'https://dev-gisy8vuij-sabeels-projects-5df24825.vercel.app',
          'http://localhost:3000',
          'http://localhost:3001',
          'http://localhost:3002',
          'http://localhost:3003',
          'http://localhost:5173'
        ],
    },
    rateLimitWindowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  }
}

export const config = getEnvironmentConfig()
