# DEVLAB Deployment Guide

## Overview

This guide covers the deployment of the DEVLAB microservice across different environments using Vercel (frontend) and Railway (backend).

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway       │    │   Supabase      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   MongoDB       │
                       │   Atlas         │
                       │   (Operational) │
                       └─────────────────┘
```

## Prerequisites

### Required Accounts
- [Vercel Account](https://vercel.com) - Frontend hosting
- [Railway Account](https://railway.app) - Backend hosting
- [Supabase Account](https://supabase.com) - PostgreSQL database
- [MongoDB Atlas](https://cloud.mongodb.com) - Operational database
- [GitHub Account](https://github.com) - Source control and CI/CD

### Required Services
- Gemini API key for AI functionality
- SandBox API key for code execution
- Service API keys for microservice communication

## Environment Setup

### 1. Frontend (Vercel)

#### Environment Variables
Configure these in Vercel dashboard:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://devlab-api.railway.app

# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# External Services
NEXT_PUBLIC_ASSESSMENT_SERVICE_URL=https://assessment-service.railway.app
NEXT_PUBLIC_CONTENT_STUDIO_URL=https://content-studio.railway.app
NEXT_PUBLIC_LEARNING_ANALYTICS_URL=https://learning-analytics.railway.app
NEXT_PUBLIC_COURSE_BUILDER_URL=https://course-builder.railway.app
```

#### Deployment Steps
1. Connect GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `frontend/dist`
4. Configure environment variables
5. Deploy

### 2. Backend (Railway)

#### Environment Variables
Configure these in Railway dashboard:

```bash
# Application Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
MONGODB_ATLAS_URI=mongodb+srv://username:password@cluster.mongodb.net/devlab

# External Services
ASSESSMENT_SERVICE_URL=https://assessment-service.railway.app
CONTENT_STUDIO_URL=https://content-studio.railway.app
LEARNING_ANALYTICS_URL=https://learning-analytics.railway.app
COURSE_BUILDER_URL=https://course-builder.railway.app

# AI Services
GEMINI_API_KEY=your-gemini-api-key
SANDBOX_API_KEY=your-sandbox-api-key
SANDBOX_API_URL=https://sandbox-api.example.com

# Security
SERVICE_JWT_SECRET=your-jwt-secret
SERVICE_API_KEYS=key1,key2,key3
CORS_ORIGINS=https://devlab.vercel.app,https://devlab-staging.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Deployment Steps
1. Connect GitHub repository to Railway
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Configure environment variables
5. Deploy

### 3. Database Setup

#### Supabase (PostgreSQL)
1. Create new project in Supabase
2. Run database migrations
3. Configure Row Level Security (RLS)
4. Set up service role key

#### MongoDB Atlas
1. Create cluster in MongoDB Atlas
2. Create database and collections
3. Configure network access
4. Set up connection string

## CI/CD Pipeline

### GitHub Actions Workflow

The project includes automated CI/CD using GitHub Actions:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-ci:
    # Frontend testing and building
  backend-ci:
    # Backend testing and building
  integration-tests:
    # Integration testing
  deploy-staging:
    # Deploy to staging environment
  deploy-production:
    # Deploy to production environment
```

### Required GitHub Secrets

Configure these in GitHub repository settings:

```bash
# Vercel
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id

# Railway
RAILWAY_TOKEN=your-railway-token

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
MONGODB_ATLAS_URI=your-mongodb-uri

# AI Services
GEMINI_API_KEY=your-gemini-api-key
SANDBOX_API_KEY=your-sandbox-api-key

# Test Environment
SUPABASE_TEST_URL=your-test-supabase-url
SUPABASE_TEST_ANON_KEY=your-test-supabase-anon-key
SUPABASE_TEST_SERVICE_KEY=your-test-supabase-service-key
MONGODB_TEST_URI=your-test-mongodb-uri
GEMINI_TEST_API_KEY=your-test-gemini-api-key
SANDBOX_TEST_API_KEY=your-test-sandbox-api-key
```

## Deployment Environments

### Development
- **Frontend**: `http://localhost:3001`
- **Backend**: `http://localhost:3001`
- **Database**: Local Supabase and MongoDB

### Staging
- **Frontend**: `https://devlab-staging.vercel.app`
- **Backend**: `https://devlab-staging-api.railway.app`
- **Database**: Staging Supabase and MongoDB

### Production
- **Frontend**: `https://devlab.vercel.app`
- **Backend**: `https://devlab-api.railway.app`
- **Database**: Production Supabase and MongoDB

## Monitoring and Observability

### Health Checks
- **Backend**: `GET /health`
- **Frontend**: Built-in Vercel health checks
- **Database**: Connection monitoring

### Logging
- **Application Logs**: Railway logs
- **Error Tracking**: MongoDB Atlas for operational data
- **Performance**: Vercel Analytics

### Metrics
- **Response Time**: < 2 seconds
- **Uptime**: 99.9% target
- **Error Rate**: < 0.1%
- **Concurrent Users**: 10,000+ supported

## Security Configuration

### CORS Settings
```javascript
// Backend CORS configuration
const corsOptions = {
  origin: [
    'https://devlab.vercel.app',
    'https://devlab-staging.vercel.app'
  ],
  credentials: true
}
```

### Rate Limiting
```javascript
// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
})
```

### Environment Variables Security
- No `.env` files in production
- All secrets managed through cloud platforms
- Service-to-service authentication with API keys
- JWT tokens for user authentication

## Troubleshooting

### Common Issues

#### Frontend Deployment Issues
1. **Build Failures**: Check environment variables
2. **API Connection**: Verify `NEXT_PUBLIC_API_URL`
3. **Database Connection**: Check Supabase configuration

#### Backend Deployment Issues
1. **Database Connection**: Verify connection strings
2. **External Services**: Check service URLs and API keys
3. **Memory Issues**: Monitor Railway resource usage

#### Database Issues
1. **Connection Timeouts**: Check network access
2. **Authentication**: Verify service keys
3. **Performance**: Monitor query performance

### Debug Commands

```bash
# Check backend health
curl https://devlab-api.railway.app/health

# Check frontend deployment
curl https://devlab.vercel.app

# Test database connection
npm run test:db-connection
```

## Rollback Procedures

### Frontend Rollback
1. Go to Vercel dashboard
2. Navigate to deployments
3. Select previous deployment
4. Click "Promote to Production"

### Backend Rollback
1. Go to Railway dashboard
2. Navigate to deployments
3. Select previous deployment
4. Click "Deploy"

### Database Rollback
1. Use Supabase dashboard for schema changes
2. Use MongoDB Atlas for data rollback
3. Restore from backups if necessary

## Performance Optimization

### Frontend
- Vercel CDN for static assets
- Image optimization
- Code splitting
- Caching strategies

### Backend
- Railway auto-scaling
- Database connection pooling
- Caching with Redis (if needed)
- API response optimization

### Database
- Supabase connection pooling
- MongoDB Atlas auto-scaling
- Query optimization
- Index management

## Support and Maintenance

### Regular Tasks
- Monitor system health
- Update dependencies
- Review security patches
- Backup verification

### Emergency Procedures
- Incident response plan
- Contact information
- Escalation procedures
- Recovery steps

## Contact Information

- **Technical Support**: devops@devlab.com
- **Security Issues**: security@devlab.com
- **General Inquiries**: support@devlab.com




