#!/bin/bash

echo "🚀 DEVLAB Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "1. GitHub repository created"
echo "2. Vercel account and project created"
echo "3. Railway account and project created"
echo "4. Gemini API key obtained"
echo ""

read -p "Have you completed all prerequisites? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the prerequisites first:"
    echo "1. Create GitHub repository"
    echo "2. Create Vercel project"
    echo "3. Create Railway project"
    echo "4. Get Gemini API key from https://makersuite.google.com/app/apikey"
    exit 1
fi

echo "🔧 Setting up GitHub Secrets..."
echo "Please add these secrets in GitHub Repository → Settings → Secrets:"
echo ""
echo "VERCEL_TOKEN=your-vercel-token"
echo "VERCEL_ORG_ID=your-vercel-org-id"
echo "VERCEL_PROJECT_ID=your-vercel-project-id"
echo "RAILWAY_TOKEN=your-railway-token"
echo "RAILWAY_SERVICE_ID=your-railway-service-id"
echo "GEMINI_API_KEY=your-gemini-api-key"
echo ""

read -p "Have you added all GitHub secrets? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add the GitHub secrets first, then run this script again."
    exit 1
fi

echo "🌐 Setting up Vercel Environment Variables..."
echo "Please add these in Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "VITE_API_URL=https://devlab-backend.railway.app"
echo "VITE_GEMINI_API_KEY=your-gemini-api-key"
echo ""

read -p "Have you added Vercel environment variables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add the Vercel environment variables first, then run this script again."
    exit 1
fi

echo "🚂 Setting up Railway Environment Variables..."
echo "Please add these in Railway Dashboard → Variables:"
echo ""
echo "GEMINI_API_KEY=your-gemini-api-key"
echo "NODE_ENV=production"
echo "PORT=3001"
echo "CORS_ORIGINS=https://devlab-frontend.vercel.app"
echo ""

read -p "Have you added Railway environment variables? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please add the Railway environment variables first, then run this script again."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building applications..."
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

echo "🚀 Pushing to GitHub to trigger deployment..."
git add .
git commit -m "Deploy: Setup CI/CD pipeline for Vercel and Railway"
git push origin main

echo ""
echo "🎉 Deployment initiated!"
echo ""
echo "📊 Monitor deployment status:"
echo "- GitHub Actions: https://github.com/your-username/your-repo/actions"
echo "- Vercel Dashboard: https://vercel.com/dashboard"
echo "- Railway Dashboard: https://railway.app/dashboard"
echo ""
echo "🔗 Your live URLs will be:"
echo "- Frontend: https://devlab-frontend.vercel.app"
echo "- Backend: https://devlab-backend.railway.app"
echo ""
echo "⏱️ Deployment typically takes 2-5 minutes"
echo "✅ Check the GitHub Actions tab for deployment progress"
