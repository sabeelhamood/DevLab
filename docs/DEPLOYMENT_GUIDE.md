# Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the DEVLAB microservice to production environments.

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Vercel account configured
- [ ] Railway account configured
- [ ] Supabase project created
- [ ] MongoDB Atlas cluster created
- [ ] Domain names configured
- [ ] SSL certificates ready

### ✅ Environment Variables
- [ ] All required environment variables set
- [ ] Secrets properly configured
- [ ] API keys validated
- [ ] Database connections tested

### ✅ Security Configuration
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS settings applied
- [ ] Authentication working
- [ ] Monitoring enabled

## Deployment Steps

### 1. Frontend Deployment (Vercel)

#### Step 1: Connect Repository
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project
vercel link
```

#### Step 2: Configure Environment Variables
```bash
# Set environment variables in Vercel dashboard
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

#### Step 3: Deploy
```bash
# Deploy to production
vercel --prod

# Verify deployment
curl https://devlab.vercel.app/health
```

### 2. Backend Deployment (Railway)

#### Step 1: Connect Repository
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project
railway link
```

#### Step 2: Configure Environment Variables
```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SUPABASE_URL=$SUPABASE_URL
railway variables set SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY
railway variables set MONGODB_ATLAS_URI=$MONGODB_ATLAS_URI
railway variables set GEMINI_API_KEY=$GEMINI_API_KEY
railway variables set SANDBOX_API_KEY=$SANDBOX_API_KEY
railway variables set SERVICE_JWT_SECRET=$SERVICE_JWT_SECRET
railway variables set SERVICE_API_KEYS=$SERVICE_API_KEYS
railway variables set CORS_ORIGINS=https://devlab.vercel.app
```

#### Step 3: Deploy
```bash
# Deploy to production
railway up

# Verify deployment
curl https://devlab-api.railway.app/health
```

### 3. Database Setup

#### Supabase Configuration
```sql
-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);
```

#### MongoDB Atlas Configuration
```javascript
// Create collections and indexes
db.sessions.createIndex({ "learnerId": 1, "createdAt": -1 })
db.analytics.createIndex({ "learnerId": 1, "timestamp": -1 })
db.security_events.createIndex({ "timestamp": -1, "severity": 1 })
```

## Post-Deployment Verification

### 1. Health Checks

#### Frontend Health Check
```bash
curl -I https://devlab.vercel.app
# Expected: 200 OK
```

#### Backend Health Check
```bash
curl https://devlab-api.railway.app/health
# Expected: {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

### 2. API Testing

#### Authentication Test
```bash
# Test login endpoint
curl -X POST https://devlab-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Question API Test
```bash
# Test questions endpoint
curl -X GET "https://devlab-api.railway.app/api/questions/personalized?courseId=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Database Connectivity

#### Supabase Connection Test
```bash
# Test Supabase connection
curl -X GET "https://your-project.supabase.co/rest/v1/users?select=*" \
  -H "apikey: YOUR_SUPABASE_ANON_KEY"
```

#### MongoDB Connection Test
```bash
# Test MongoDB connection
curl -X GET "https://devlab-api.railway.app/api/health"
# Check for database connection status
```

## Monitoring Setup

### 1. Application Monitoring

#### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Configure custom events
- Set up performance monitoring

#### Railway Monitoring
- Enable Railway monitoring
- Configure alerting
- Set up log aggregation

### 2. Security Monitoring

#### Security Dashboard
```bash
# Access security dashboard
curl -X GET "https://devlab-api.railway.app/api/security/dashboard" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Security Metrics
```bash
# Get security metrics
curl -X GET "https://devlab-api.railway.app/api/security/metrics" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 3. Performance Monitoring

#### Frontend Performance
- Lighthouse CI integration
- Core Web Vitals monitoring
- Bundle size tracking

#### Backend Performance
- Response time monitoring
- Throughput tracking
- Error rate monitoring

## Rollback Procedures

### 1. Frontend Rollback

#### Vercel Rollback
```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### 2. Backend Rollback

#### Railway Rollback
```bash
# List deployments
railway status

# Rollback to previous deployment
railway rollback
```

### 3. Database Rollback

#### Supabase Rollback
- Use Supabase dashboard
- Restore from backup
- Apply migration rollback

#### MongoDB Rollback
- Use MongoDB Atlas
- Restore from backup
- Apply data rollback

## Maintenance Procedures

### 1. Regular Maintenance

#### Daily Tasks
- [ ] Check system health
- [ ] Review security events
- [ ] Monitor performance metrics
- [ ] Verify backups

#### Weekly Tasks
- [ ] Update dependencies
- [ ] Review security logs
- [ ] Performance optimization
- [ ] Capacity planning

#### Monthly Tasks
- [ ] Security audit
- [ ] Performance review
- [ ] Backup verification
- [ ] Documentation update

### 2. Scaling Procedures

#### Horizontal Scaling
```bash
# Scale Railway service
railway scale --replicas 3

# Scale Vercel functions
# Configure in Vercel dashboard
```

#### Vertical Scaling
```bash
# Upgrade Railway plan
railway plan upgrade

# Configure Vercel Pro
# Upgrade in Vercel dashboard
```

## Troubleshooting

### Common Issues

#### Frontend Issues
1. **Build Failures**: Check environment variables
2. **API Connection**: Verify API URL configuration
3. **Performance**: Optimize bundle size

#### Backend Issues
1. **Database Connection**: Check connection strings
2. **Memory Issues**: Monitor resource usage
3. **API Errors**: Check logs and monitoring

#### Database Issues
1. **Connection Timeouts**: Check network configuration
2. **Query Performance**: Optimize database queries
3. **Storage Issues**: Monitor storage usage

### Debug Commands

```bash
# Check application logs
railway logs

# Check Vercel logs
vercel logs

# Test database connection
npm run test:db-connection

# Check security status
curl https://devlab-api.railway.app/api/security/dashboard
```

## Support and Maintenance

### Contact Information
- **Technical Support**: devops@devlab.com
- **Security Issues**: security@devlab.com
- **General Inquiries**: support@devlab.com

### Documentation
- **API Documentation**: https://devlab-docs.vercel.app
- **User Guide**: https://devlab-guide.vercel.app
- **Developer Guide**: https://devlab-dev.vercel.app

### Monitoring Dashboards
- **Application Monitoring**: Railway Dashboard
- **Frontend Analytics**: Vercel Analytics
- **Security Monitoring**: Security Dashboard
- **Performance Metrics**: Custom Dashboards

## Conclusion

This deployment guide ensures successful production deployment of the DEVLAB microservice with proper monitoring, security, and maintenance procedures in place.
