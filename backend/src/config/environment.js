/* eslint-disable complexity, max-lines-per-function */
const getEnvironmentConfig = () => {
  const nodeEnv = process.env['NODE_ENV'] || 'development';

  return {
    nodeEnv,
    port: parseInt(process.env['PORT'] || '3000'),
    database: {
      supabase: {
        url: process.env['SUPABASE_URL'] || '',
        serviceKey:
          process.env['SUPABASE_SERVICE_KEY'] ||
          process.env['SUPABASE_SERVICE_ROLE_KEY'] ||
          '',
      },
      mongodb: {
        uri: process.env['MONGODB_ATLAS_URI'] || '',
      },
    },
    externalServices: {
      judge0: {
        rapidApiKey:
          process.env['X_RAPIDAPI_KEY'] || process.env['RAPIDAPI_KEY'] || '',
        rapidApiHost:
          process.env['X_RAPIDAPI_HOST'] ||
          process.env['RAPIDAPI_HOST'] ||
          'judge0-ce.p.rapidapi.com',
        baseUrl:
          process.env['JUDGE0_BASE_URL'] || 'https://judge0-ce.p.rapidapi.com',
      },
      learningAnalytics: {
        url: process.env['LEARNING_ANALYTICS_URL'] || '',
        authToken: process.env['LEARNING_ANALYTICS_TOKEN'] || '',
        maxAttempts: parseInt(
          process.env['LEARNING_ANALYTICS_MAX_ATTEMPTS'] || '5'
        ),
        baseDelayMs: parseInt(
          process.env['LEARNING_ANALYTICS_BASE_DELAY_MS'] || '30000'
        ),
        maxDelayMs: parseInt(
          process.env['LEARNING_ANALYTICS_MAX_DELAY_MS'] || '300000'
        ),
      },
    },
    ai: {
      gemini: {
        apiKey: process.env['GEMINI_API_KEY'] || '',
        model: process.env['GEMINI_MODEL'] || 'gemini-1.5-flash',
      },
    },
    security: {
      jwtSecret: process.env['SERVICE_JWT_SECRET'] || 'dev-secret-key',
      apiKeys: process.env['SERVICE_API_KEYS'] || '',
      corsOrigins: process.env['CORS_ORIGINS']?.split(',') || [
        'http://localhost:3001',
        'http://localhost:3003',
      ],
    },
    rateLimitWindowMs: parseInt(
      process.env['RATE_LIMIT_WINDOW_MS'] || '900000'
    ), // 15 minutes
    rateLimitMaxRequests: parseInt(
      process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'
    ),
  };
};

export const config = getEnvironmentConfig();
