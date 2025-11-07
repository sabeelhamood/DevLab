# DEVLAB Deployment Guide

## 🚀 Live URLs

- **Frontend (Vercel):** https://devlab-frontend.vercel.app
- **Backend (Railway):** https://devlab-backend.railway.app
- **API Documentation:** https://devlab-backend.railway.app/api

## 🔧 Environment Variables Setup

### Vercel (Frontend)

Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://devlab-backend.railway.app
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### Railway (Backend)

Set these in Railway Dashboard → Variables:

```
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=production
PORT=3001
CORS_ORIGINS=https://devlab-frontend.vercel.app
```

## 📋 GitHub Secrets Required

Add these secrets in GitHub Repository → Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
RAILWAY_TOKEN=your-railway-token
RAILWAY_SERVICE_ID=your-railway-service-id
GEMINI_API_KEY=your-gemini-api-key
```

## 🛠️ Manual Deployment Steps

### 1. Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy frontend
cd frontend
vercel --prod
```

### 2. Deploy Backend to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Deploy backend
cd backend
railway up
```

## 🔄 Automatic Deployment

The GitHub Actions workflow will automatically deploy when you push to the `main` branch:

1. **Frontend** → Vercel
2. **Backend** → Railway
3. **Health checks** → Verify both services are running

## 🧪 Testing Deployment

### Frontend Health Check

```bash
curl https://devlab-frontend.vercel.app
```

### Backend Health Check

```bash
curl https://devlab-backend.railway.app/health
```

### Gemini API Test

```bash
curl -X POST https://devlab-backend.railway.app/api/gemini-test/test-simple
```

## 🐛 Troubleshooting

### Common Issues

1. **Environment Variables Not Set**
   - Check Vercel/Railway dashboard
   - Verify secret names match exactly

2. **CORS Errors**
   - Update CORS_ORIGINS in Railway
   - Include all Vercel preview URLs

3. **Gemini API Not Working**
   - Verify GEMINI_API_KEY is set
   - Check API key permissions

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check Vercel deployment status
vercel ls

# Test API endpoints
curl https://devlab-backend.railway.app/api/gemini/generate-question \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"topic":"JavaScript","difficulty":"beginner","type":"code"}'
```

## 📊 Monitoring

- **Vercel Analytics:** Available in Vercel dashboard
- **Railway Metrics:** Available in Railway dashboard
- **GitHub Actions:** Check workflow status in Actions tab

## 🔒 Security

- API keys stored in environment variables
- CORS configured for production domains
- Rate limiting enabled
- Health checks for monitoring

## 📈 Performance

- Frontend: Static build with Vite
- Backend: Node.js with Express
- CDN: Vercel Edge Network
- Database: Railway PostgreSQL

## 🎯 Success Criteria

✅ Frontend deployed to Vercel  
✅ Backend deployed to Railway  
✅ Environment variables configured  
✅ Gemini API integration working  
✅ CORS configured correctly  
✅ Health checks passing  
✅ Live URLs accessible

## 📞 Support

- **GitHub Issues:** Create issue in repository
- **Vercel Support:** Vercel dashboard support
- **Railway Support:** Railway dashboard support
