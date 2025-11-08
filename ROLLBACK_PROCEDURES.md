# 🔄 Rollback Procedures & Emergency Response

## Overview

This document provides comprehensive rollback procedures for the DevLab fullstack application deployed on Vercel (frontend) and Railway (backend).

## 🚨 Emergency Rollback (Immediate Response)

### 1. Stop Current Deployment
```bash
# Disable GitHub Actions workflow
gh workflow disable "Production Deployment"

# Or manually cancel running workflow
gh run cancel [RUN_ID]
```

### 2. Quick Rollback Commands

#### Frontend (Vercel)
```bash
# Rollback to previous deployment
vercel rollback --token=$VERCEL_TOKEN

# Rollback to specific deployment
vercel rollback [DEPLOYMENT_ID] --token=$VERCEL_TOKEN

# Force deploy previous version
vercel --prod --token=$VERCEL_TOKEN --force
```

#### Backend (Railway)
```bash
# Rollback to previous deployment
railway rollback --service=$RAILWAY_SERVICE_ID

# Rollback to specific deployment
railway rollback [DEPLOYMENT_ID] --service=$RAILWAY_SERVICE_ID

# Force deploy previous version
railway up --service=$RAILWAY_SERVICE_ID --detach --force
```

## 🔄 Standard Rollback Procedures

### Scenario 1: Frontend Issues

#### Step 1: Identify the Issue
```bash
# Check Vercel deployment status
vercel ls --token=$VERCEL_TOKEN

# Check specific deployment
vercel inspect [DEPLOYMENT_ID] --token=$VERCEL_TOKEN
```

#### Step 2: Rollback Frontend
```bash
# Rollback to previous working version
vercel rollback --token=$VERCEL_TOKEN

# Verify rollback
curl -I https://[vercel-url]/
```

#### Step 3: Verify Rollback
- [ ] Frontend accessible
- [ ] No JavaScript errors
- [ ] All pages loading correctly

### Scenario 2: Backend Issues

#### Step 1: Identify the Issue
```bash
# Check Railway deployment status
railway status --service=$RAILWAY_SERVICE_ID

# Check logs
railway logs --service=$RAILWAY_SERVICE_ID
```

#### Step 2: Rollback Backend
```bash
# Rollback to previous working version
railway rollback --service=$RAILWAY_SERVICE_ID

# Verify rollback
curl https://[railway-url]/health
```

#### Step 3: Verify Rollback
- [ ] Backend health check passing
- [ ] API endpoints responding
- [ ] Database connections working

### Scenario 3: Full System Rollback

#### Step 1: Stop All Deployments
```bash
# Cancel any running GitHub Actions
gh run cancel [RUN_ID]

# Disable workflow temporarily
gh workflow disable "Production Deployment"
```

#### Step 2: Rollback Both Services
```bash
# Rollback frontend
vercel rollback --token=$VERCEL_TOKEN

# Rollback backend
railway rollback --service=$RAILWAY_SERVICE_ID
```

#### Step 3: Verify Full System
```bash
# Test frontend
curl -I https://[vercel-url]/

# Test backend
curl https://[railway-url]/health

# Test integration
curl https://[railway-url]/api/health
```

## 🔍 Rollback Verification

### Health Checks
```bash
# Frontend health
curl -I https://[vercel-url]/

# Backend health
curl https://[railway-url]/health

# API health
curl https://[railway-url]/api/health
```

### Functional Tests
```bash
# Test main application flow
curl https://[vercel-url]/

# Test API endpoints
curl https://[railway-url]/api/gemini-questions/health

# Test database connectivity
curl https://[railway-url]/api/health
```

## 📊 Rollback Monitoring

### Key Metrics to Monitor
- **Response Time**: < 2 seconds
- **Error Rate**: < 1%
- **Uptime**: > 99.9%
- **Health Check**: Passing

### Monitoring Tools
- **Vercel**: Dashboard analytics
- **Railway**: Service metrics
- **GitHub Actions**: Workflow status

## 🛠️ Troubleshooting Rollback Issues

### Common Rollback Problems

#### 1. Rollback Failed
```bash
# Check deployment history
vercel ls --token=$VERCEL_TOKEN
railway status --service=$RAILWAY_SERVICE_ID

# Force rollback
vercel rollback --token=$VERCEL_TOKEN --force
railway rollback --service=$RAILWAY_SERVICE_ID --force
```

#### 2. Service Not Accessible
```bash
# Check service status
vercel inspect [DEPLOYMENT_ID] --token=$VERCEL_TOKEN
railway status --service=$RAILWAY_SERVICE_ID

# Check logs
vercel logs [DEPLOYMENT_ID] --token=$VERCEL_TOKEN
railway logs --service=$RAILWAY_SERVICE_ID
```

#### 3. Environment Variables Missing
```bash
# Check environment variables
vercel env ls --token=$VERCEL_TOKEN
railway variables --service=$RAILWAY_SERVICE_ID

# Set missing variables
vercel env add [KEY] [VALUE] --token=$VERCEL_TOKEN
railway variables set [KEY]=[VALUE] --service=$RAILWAY_SERVICE_ID
```

## 📋 Rollback Checklist

### Pre-Rollback
- [ ] Identify the issue
- [ ] Check deployment history
- [ ] Verify rollback target
- [ ] Notify team

### During Rollback
- [ ] Execute rollback commands
- [ ] Monitor deployment status
- [ ] Check service health
- [ ] Verify functionality

### Post-Rollback
- [ ] Confirm services are accessible
- [ ] Run health checks
- [ ] Test critical functionality
- [ ] Monitor for issues
- [ ] Document rollback reason

## 🚨 Emergency Contacts

### Immediate Response
- **GitHub Actions**: Check workflow logs
- **Vercel**: Support dashboard
- **Railway**: Support dashboard

### Escalation
- **DevOps Team**: [Contact Information]
- **Development Team**: [Contact Information]
- **Management**: [Contact Information]

## 📚 Rollback Best Practices

### 1. Always Test Rollback
- Test rollback procedures regularly
- Document any issues found
- Update procedures as needed

### 2. Monitor After Rollback
- Watch for 24-48 hours after rollback
- Check all critical paths
- Monitor error rates

### 3. Document Rollback
- Document the reason for rollback
- Record what was rolled back
- Note any lessons learned

## 🔧 Rollback Automation

### Automated Rollback Script
```bash
#!/bin/bash
# Emergency rollback script

echo "🚨 Starting emergency rollback..."

# Rollback frontend
echo "🔄 Rolling back frontend..."
vercel rollback --token=$VERCEL_TOKEN

# Rollback backend
echo "🔄 Rolling back backend..."
railway rollback --service=$RAILWAY_SERVICE_ID

# Verify rollback
echo "✅ Verifying rollback..."
curl -I https://[vercel-url]/
curl https://[railway-url]/health

echo "🎉 Rollback complete!"
```

### GitHub Actions Rollback Workflow
```yaml
name: Emergency Rollback
on:
  workflow_dispatch:
    inputs:
      rollback_reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback Frontend
        run: vercel rollback --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Rollback Backend
        run: railway rollback --service=${{ secrets.RAILWAY_SERVICE_ID }}
      
      - name: Verify Rollback
        run: |
          curl -I https://[vercel-url]/
          curl https://[railway-url]/health
```

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: DevOps Team
