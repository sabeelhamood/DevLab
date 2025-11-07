# 🚀 Quick Deployment Guide

## Your Live URLs (After Deployment)

- **Frontend:** https://devlab-frontend.vercel.app
- **Backend:** https://devlab-backend.railway.app
- **API Docs:** https://devlab-backend.railway.app/api

## ⚡ Quick Setup (5 Minutes)

### 1. Create Accounts & Get API Keys

```bash
# Get Gemini API Key
# Visit: https://makersuite.google.com/app/apikey
# Copy your API key (starts with AIza...)

# Create Vercel account
# Visit: https://vercel.com
# Connect GitHub account

# Create Railway account
# Visit: https://railway.app
# Connect GitHub account
```

### 2. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
RAILWAY_TOKEN=your-railway-token
RAILWAY_SERVICE_ID=your-railway-service-id
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Deploy with One Command

```bash
# Push to GitHub (triggers automatic deployment)
git add .
git commit -m "Deploy to production"
git push origin main
```

## 🔧 Manual Environment Setup

### Vercel Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://devlab-backend.railway.app
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Railway Environment Variables

In Railway Dashboard → Variables:

```
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://devlab-frontend.vercel.app
```

## 🧪 Test Your Deployment

### Frontend Test

```bash
curl https://devlab-frontend.vercel.app
```

### Backend Test

```bash
curl https://devlab-backend.railway.app/health
```

### Gemini API Test

```bash
curl -X POST https://devlab-backend.railway.app/api/gemini-test/test-simple
```

## 📊 Monitor Deployment

- **GitHub Actions:** Check workflow status
- **Vercel Dashboard:** Monitor frontend deployment
- **Railway Dashboard:** Monitor backend deployment

## 🎯 Expected Results

After successful deployment:

- ✅ Frontend loads at Vercel URL
- ✅ Backend API responds at Railway URL
- ✅ Gemini AI integration working
- ✅ CORS configured correctly
- ✅ Environment variables loaded

## 🚨 Troubleshooting

### If Frontend Doesn't Load

1. Check Vercel deployment logs
2. Verify environment variables
3. Check build process

### If Backend Doesn't Respond

1. Check Railway deployment logs
2. Verify environment variables
3. Check health endpoint

### If Gemini API Fails

1. Verify GEMINI_API_KEY is set
2. Check API key permissions
3. Test with curl command

## 🎉 Success!

Once deployed, your DEVLAB application will be live with:

- **AI-powered question generation**
- **Real-time code evaluation**
- **Intelligent learning recommendations**
- **Secure API key management**

Your users can now access the full learning platform at the live URLs!
