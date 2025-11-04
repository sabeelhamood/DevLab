/**
 * Environment Configuration
 * Loads and validates all environment variables
 */

import dotenv from 'dotenv';

// Load .env file only if it exists (for local development fallback)
// In Railway, all env vars are automatically available from Service Variables
try {
  dotenv.config();
} catch (error) {
  // .env file is optional - Railway provides env vars automatically
  console.info('ℹ️  No .env file found. Using environment variables (Railway Service Variables in production).');
}

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'MONGO_URL',
  'GEMINI_API_KEY'
];

// Validate required environment variables
// Note: In production (Railway), we don't block startup - server must start for healthchecks
// Missing keys will be reported in /health endpoint but won't prevent server from starting
const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];
  
  // Only require GEMINI_API_KEY for question generation to work
  // Other variables are optional for local development
  if (!process.env.GEMINI_API_KEY) {
    missing.push('GEMINI_API_KEY (required for Gemini API integration)');
  }
  
  // Check for RapidAPI key (optional - only needed for code execution)
  // Railway uses X_RAPIDAPI_KEY (uppercase with underscore), but we also support lowercase with hyphens
  const hasRapidApiKey = process.env.X_RAPIDAPI_KEY || process.env['x-rapidapi-key'] || process.env.JUDGE0_API_KEY;
  if (!hasRapidApiKey) {
    console.warn('⚠️  Judge0/RapidAPI keys not found. Code execution will not work without them.');
  }
  
  // Warn about optional database variables but don't fail
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.warn('⚠️  Supabase configuration not found. Database storage will not work.');
  }
  
  if (!process.env.MONGO_URL) {
    console.warn('⚠️  MongoDB URL not found. MongoDB features will not work.');
  }
  
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}\n\n` +
      `For local development, you have two options:\n\n` +
      `Option 1 (Recommended): Use Railway CLI\n` +
      `  1. Install Railway CLI: npm i -g @railway/cli\n` +
      `  2. Login: railway login\n` +
      `  3. Link project: railway link\n` +
      `  4. Run with Railway env vars: railway run npm run dev\n\n` +
      `Option 2: Create .env file (temporary, for local dev only)\n` +
      `  Create backend/.env with:\n` +
      `  GEMINI_API_KEY=your-api-key-from-railway\n\n` +
      `Get your Gemini API key from Railway Service Variables.`;
    
    // In production (Railway), warn but don't throw - server must start for healthchecks
    if (isProduction) {
      console.warn(`⚠️  WARNING: ${errorMsg}`);
      console.warn('⚠️  Server will start but some features will not work until environment variables are set.');
    } else {
      // In development, throw to prevent running with missing config
      throw new Error(errorMsg);
    }
  }
};

validateEnv();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3001,
  
  database: {
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY
    },
    mongodb: {
      url: process.env.MONGO_URL
    }
  },
  
  externalApis: {
    gemini: {
      // Automatically loaded from Railway Service Variables (GEMINI_API_KEY)
      // In Railway: This is set in Service Variables and automatically available as env var
      apiKey: process.env.GEMINI_API_KEY
    },
    judge0: {
      // RapidAPI configuration for Judge0 Free Plan (automatically loaded from Railway Service Variables)
      // Get your free RapidAPI key from: https://rapidapi.com/judge0-official/api/judge0-ce
      // Subscribe to the free plan - no manual .env file needed, keys come from Railway
      // Variable names in Railway Service Variables: X_RAPIDAPI_KEY and X_RAPIDAPI_HOST (uppercase with underscores)
      // Also supports lowercase with hyphens for backward compatibility: x-rapidapi-key and x-rapidapi-host
      apiKey: process.env.X_RAPIDAPI_KEY || process.env['x-rapidapi-key'] || process.env.JUDGE0_API_KEY, // X-RapidAPI-Key (from Railway Service Variables)
      apiHost: process.env.X_RAPIDAPI_HOST || process.env['x-rapidapi-host'] || process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com', // X-RapidAPI-Host (from Railway Service Variables)
      // Judge0 via RapidAPI Free Plan endpoint
      apiUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com'
    }
  },
  
  microservices: {
    courseBuilder: process.env.COURSE_BUILDER_URL || 'http://localhost:3002',
    contentStudio: process.env.CONTENT_STUDIO_URL || 'http://localhost:3003',
    assessment: process.env.ASSESSMENT_URL || 'http://localhost:3004',
    learningAnalytics: process.env.LEARNING_ANALYTICS_URL || 'http://localhost:3005',
    rag: process.env.RAG_URL || 'http://localhost:3006'
  },
  
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://dev-lab-phi.vercel.app',
      'https://devlab-backend-production.up.railway.app'
    ],
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    serviceApiKey: process.env.SERVICE_API_KEY || 'dev-api-key'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default config;


