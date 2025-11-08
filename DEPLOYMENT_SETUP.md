# 🚀 Automatic Deployment Setup

This document explains how to set up automatic deployment for the fullstack DevLab application.

## 📋 Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Vercel Secrets
- `VERCEL_TOKEN` - Your Vercel personal access token
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VERCEL_ORG_ID` - Your Vercel organization ID

### Railway Secrets
- `RAILWAY_TOKEN` - Your Railway personal access token
- `RAILWAY_PROJECT_ID` - Your Railway project ID
- `RAILWAY_SERVICE_ID` - Your Railway service ID
- `GEMINI_API_KEY` - Your Gemini API key

## 🏗️ Deployment Architecture

### Frontend (Vercel)
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/dist`
- **Framework**: Vite
- **Auto-deployment**: Triggered on every push to `main`

### Backend (Railway)
- **Root Directory**: `backend/`
- **Build Command**: `cd backend && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: `GEMINI_API_KEY` set automatically
- **Auto-deployment**: Triggered on every push to `main`

## 🔄 Workflow Process

1. **Push to main branch** triggers GitHub Actions
2. **Frontend deployment**:
   - Validates Vercel secrets
   - Installs Vercel CLI
   - Builds and deploys to Vercel
3. **Backend deployment**:
   - Validates Railway secrets
   - Installs Railway CLI
   - Sets environment variables
   - Builds and deploys to Railway
4. **Summary**: Shows deployment status and URLs

## 🛠️ Manual Setup Steps

### 1. Vercel Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import your GitHub repository
3. Configure build settings:
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
4. Get your Project ID from Settings → General
5. Get your Organization ID from Settings → General

### 2. Railway Setup
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Create a new project from your GitHub repository
3. Set the root directory to `backend/`
4. Add environment variable: `GEMINI_API_KEY`
5. Get your Project ID and Service ID from the dashboard

### 3. GitHub Secrets Setup
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add all required secrets listed above

## 🧪 Testing Deployment

### Test Frontend Deployment
```bash
# Manual Vercel deployment
cd frontend
vercel --prod
```

### Test Backend Deployment
```bash
# Manual Railway deployment
cd backend
railway up
```

## 📊 Monitoring Deployments

- **GitHub Actions**: Check the Actions tab for deployment logs
- **Vercel**: Monitor deployments in Vercel dashboard
- **Railway**: Monitor deployments in Railway dashboard

## 🔧 Troubleshooting

### Common Issues

1. **Vercel 404 Error**: Check `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID`
2. **Railway Build Failure**: Ensure `backend/package.json` has `build` script
3. **Missing Secrets**: Verify all GitHub secrets are set correctly
4. **CORS Issues**: Check `CORS_ORIGINS` in Railway environment variables

### Debug Commands

```bash
# Check Vercel deployment
vercel ls

# Check Railway deployment
railway status

# View Railway logs
railway logs
```

## 🎯 Success Criteria

After setup, pushing to `main` should:
- ✅ Build and deploy frontend to Vercel
- ✅ Build and deploy backend to Railway
- ✅ Set `GEMINI_API_KEY` in Railway environment
- ✅ Show deployment URLs in GitHub Actions summary
- ✅ Keep backend running as Node.js server

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs for detailed error messages
2. Verify all secrets are correctly set
3. Test manual deployments first
4. Check Vercel and Railway dashboards for deployment status
