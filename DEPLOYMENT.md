# 🚀 DEVLAB Microservice - Production Deployment Guide

This guide covers the complete production deployment of the DEVLAB microservice using GitHub Actions, Vercel (frontend), and Railway (backend).

## 📋 Prerequisites

### Required Accounts
- [GitHub](https://github.com) - Repository hosting and CI/CD
- [Vercel](https://vercel.com) - Frontend hosting
- [Railway](https://railway.app) - Backend hosting and database
- [Google Cloud](https://cloud.google.com) - Gemini AI API access

### Required Tools
- Node.js 20+
- Git
- Docker (optional, for local testing)

## 🔧 Setup Instructions

### 1. GitHub Repository Setup

1. **Create a new GitHub repository:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: DEVLAB microservice"
   git branch -M main
   git remote add origin https://github.com/yourusername/devlab-microservice.git
   git push -u origin main
   ```

2. **Set up GitHub Secrets:**
   Go to your repository → Settings → Secrets and variables → Actions, and add:
   ```
   VERCEL_TOKEN=your-vercel-token
   VERCEL_ORG_ID=your-vercel-org-id
   VERCEL_PROJECT_ID=your-vercel-project-id
   RAILWAY_TOKEN=your-railway-token
   ```

### 2. Vercel Frontend Deployment

1. **Connect to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Set Root Directory to `frontend`

2. **Configure Environment Variables:**
   In Vercel Dashboard → Project Settings → Environment Variables:
   ```
   NEXT_PUBLIC_BACKEND_API_URL=https://your-backend.railway.app/api
   NEXT_PUBLIC_APP_ENV=production
   ```

3. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - Your frontend will be available at: `https://your-project.vercel.app`

### 3. Railway Backend Deployment

1. **Create Railway Project:**
   - Go to [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Set Root Directory to `backend`

2. **Add Database Services:**
   - Add PostgreSQL database
   - Add Redis database
   - Railway will provide connection strings automatically

3. **Configure Environment Variables:**
   In Railway Dashboard → Variables tab:
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=your-super-secure-jwt-secret-key
   GEMINI_API_KEY=your-gemini-api-key
   # ... (see env.production.example for full list)
   ```

4. **Deploy:**
   - Railway will automatically deploy on every push to main branch
   - Your backend will be available at: `https://your-project.railway.app`

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:

1. **Runs Tests:**
   - Frontend: Linting, type checking, unit tests, integration tests
   - Backend: Linting, type checking, unit tests, integration tests, e2e tests

2. **Security Scanning:**
   - Trivy vulnerability scanner
   - Uploads results to GitHub Security tab

3. **Builds Docker Images:**
   - Creates production-ready Docker images
   - Pushes to GitHub Container Registry

4. **Deploys:**
   - Frontend to Vercel
   - Backend to Railway

## 🌍 Environment Configuration

### Production Environment Variables

Copy `env.production.example` and configure the following key variables:

#### Database (Railway)
```bash
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://:password@host:port
```

#### External Services
```bash
AUTH_SERVICE_URL=https://auth.educore-ai.com/api
DIRECTORY_SERVICE_URL=https://directory.educore-ai.com/api
GEMINI_API_KEY=your-gemini-api-key
```

#### Security
```bash
JWT_SECRET=your-super-secure-jwt-secret-key-min-32-chars
ENCRYPTION_KEY=your-32-character-encryption-key
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Backend Health:** `https://your-backend.railway.app/health`
- **Readiness:** `https://your-backend.railway.app/health/ready`
- **Liveness:** `https://your-backend.railway.app/health/live`

### Monitoring Setup
1. **Railway Metrics:** Built-in monitoring in Railway dashboard
2. **Vercel Analytics:** Built-in analytics in Vercel dashboard
3. **Custom Monitoring:** Add Prometheus/Grafana if needed

## 🔒 Security Configuration

### SSL/TLS
- **Vercel:** Automatic SSL certificates
- **Railway:** Automatic SSL certificates
- **Custom Domains:** Configure in respective dashboards

### Security Headers
- CORS configured for production domains
- Security headers set in `vercel.json`
- Rate limiting enabled

### Secrets Management
- Use platform-specific secret management
- Never commit secrets to repository
- Rotate secrets regularly

## 🚀 Deployment Commands

### Manual Deployment

1. **Deploy Frontend:**
   ```bash
   cd frontend
   vercel --prod
   ```

2. **Deploy Backend:**
   ```bash
   cd backend
   railway up
   ```

### Local Testing

1. **Test with Docker:**
   ```bash
   docker-compose up --build
   ```

2. **Test Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check environment variables
   - Verify all dependencies are installed
   - Check build logs in respective platforms

2. **Database Connection Issues:**
   - Verify database credentials
   - Check network connectivity
   - Ensure database is running

3. **API Connection Issues:**
   - Verify backend URL in frontend
   - Check CORS configuration
   - Verify API endpoints are accessible

### Debug Commands

1. **Check Backend Health:**
   ```bash
   curl https://your-backend.railway.app/health
   ```

2. **Check Frontend Build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Check Backend Build:**
   ```bash
   cd backend
   npm run build
   ```

## 📈 Performance Optimization

### Frontend (Vercel)
- Enable Vercel Analytics
- Configure CDN settings
- Optimize images and assets
- Use Next.js Image optimization

### Backend (Railway)
- Configure connection pooling
- Enable Redis caching
- Optimize database queries
- Monitor resource usage

## 🔄 Rollback Procedures

### Vercel Rollback
1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments tab
4. Click "Promote to Production" on previous deployment

### Railway Rollback
1. Go to Railway Dashboard
2. Select your service
3. Go to Deployments tab
4. Click "Redeploy" on previous deployment

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review GitHub Actions logs
3. Check application logs in respective platforms
4. Contact support teams if needed

## 🎯 Next Steps

After successful deployment:
1. Configure custom domains (optional)
2. Set up monitoring and alerting
3. Configure backup strategies
4. Plan for scaling and load balancing
5. Set up staging environment for testing

---

**Happy Deploying! 🚀**
