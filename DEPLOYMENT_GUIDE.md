# 🚀 Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the DevLab fullstack application using GitHub Actions, Vercel (frontend), and Railway (backend).

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions │───▶│   Production    │
│                 │    │   Workflow      │    │   Deployment    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Frontend (Vercel) │
                    │  Backend (Railway) │
                    └─────────────────┘
```

## 🔐 Required Secrets

### GitHub Secrets Configuration

Navigate to: `Settings` → `Secrets and variables` → `Actions`

#### Vercel Secrets
- `VERCEL_TOKEN`: Personal access token from Vercel
- `VERCEL_PROJECT_ID`: Project ID from Vercel dashboard
- `VERCEL_ORG_ID`: Organization ID (optional)

#### Railway Secrets
- `RAILWAY_TOKEN`: Personal access token from Railway
- `RAILWAY_PROJECT_ID`: Project ID from Railway dashboard
- `RAILWAY_SERVICE_ID`: Service ID (optional)
- `GEMINI_API_KEY`: API key for Gemini AI service

## 🚀 Deployment Process

### 1. Automatic Deployment

The deployment is triggered automatically on every push to the `main` branch.

```bash
# Trigger deployment
git add .
git commit -m "Deploy to production"
git push origin main
```

### 2. Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub Actions tab
2. Select "Production Deployment" workflow
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## 📊 Deployment Workflow

### Frontend Deployment (Vercel)

1. **Checkout Repository**
2. **Setup Node.js** (v18)
3. **Validate Secrets**
4. **Install Dependencies**
5. **Run Tests** (if configured)
6. **Build Frontend**
7. **Deploy to Vercel**
8. **Smoke Test**

### Backend Deployment (Railway)

1. **Checkout Repository**
2. **Setup Node.js** (v18)
3. **Validate Secrets**
4. **Install Dependencies**
5. **Run Tests** (if configured)
6. **Build Backend**
7. **Deploy to Railway**
8. **Smoke Test**

### Integration Testing

1. **Test Frontend-Backend Connectivity**
2. **Validate API Endpoints**
3. **Check Health Endpoints**

## 🔄 Rollback Procedures

### Frontend Rollback (Vercel)

```bash
# Option 1: Revert to previous deployment
vercel rollback --token=$VERCEL_TOKEN

# Option 2: Deploy specific commit
vercel --prod --token=$VERCEL_TOKEN --force
```

### Backend Rollback (Railway)

```bash
# Option 1: Revert to previous deployment
railway rollback --service=$RAILWAY_SERVICE_ID

# Option 2: Deploy specific commit
railway up --service=$RAILWAY_SERVICE_ID --detach
```

### Emergency Rollback

1. **Immediate**: Disable GitHub Actions workflow
2. **Quick**: Revert to previous commit
3. **Manual**: Deploy previous working version

## 📈 Monitoring & Observability

### Health Checks

- **Frontend**: `https://[vercel-url]/`
- **Backend**: `https://[railway-url]/health`
- **API**: `https://[railway-url]/api/health`

### Monitoring Endpoints

- **Frontend Status**: Vercel dashboard
- **Backend Status**: Railway dashboard
- **Logs**: GitHub Actions logs

## 🛠️ Troubleshooting

### Common Issues

#### 1. Secret Validation Failed
```
❌ VERCEL_TOKEN is missing
```
**Solution**: Add missing secrets to GitHub repository settings

#### 2. Build Failed
```
❌ Build failed with exit code 1
```
**Solution**: Check build logs for specific errors

#### 3. Deployment Failed
```
❌ Deployment failed
```
**Solution**: Check platform-specific logs (Vercel/Railway)

#### 4. Smoke Test Failed
```
❌ Smoke test failed
```
**Solution**: Check if services are accessible and running

### Debug Commands

```bash
# Check GitHub Actions status
gh run list --workflow="Production Deployment"

# Check Vercel deployments
vercel ls --token=$VERCEL_TOKEN

# Check Railway status
railway status --service=$RAILWAY_SERVICE_ID
```

## 📋 Pre-Deployment Checklist

- [ ] All secrets configured in GitHub
- [ ] Vercel project connected to repository
- [ ] Railway project connected to repository
- [ ] Environment variables set correctly
- [ ] Tests passing locally
- [ ] Build successful locally

## 📋 Post-Deployment Checklist

- [ ] Frontend accessible at Vercel URL
- [ ] Backend accessible at Railway URL
- [ ] Health endpoints responding
- [ ] API endpoints functional
- [ ] Integration tests passing
- [ ] Monitoring active

## 🔧 Configuration Files

### Frontend (Vercel)
- `vercel.json`: Vercel configuration
- `frontend/vercel.json`: Frontend-specific config

### Backend (Railway)
- `railway.toml`: Railway configuration
- `backend/railway.json`: Backend-specific config

### GitHub Actions
- `.github/workflows/production-deploy.yml`: Main deployment workflow

## 📞 Support & Escalation

### Immediate Issues
1. Check GitHub Actions logs
2. Check Vercel/Railway dashboards
3. Review deployment status

### Escalation Contacts
- **DevOps**: GitHub Actions logs
- **Frontend**: Vercel support
- **Backend**: Railway support

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)

## 🎯 Success Criteria

✅ **Frontend deployed to Vercel with working URL**
✅ **Backend deployed to Railway with working URL**
✅ **All health checks passing**
✅ **Integration tests successful**
✅ **Monitoring active**
✅ **Documentation complete**

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: DevOps Team
