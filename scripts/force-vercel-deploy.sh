#!/bin/bash
# Force Vercel Deployment Script
# This script forces a fresh deployment to Vercel without cache

set -e

echo "🚀 Forcing fresh Vercel deployment..."

# Check if VERCEL_TOKEN is set
if [ -z "$VERCEL_TOKEN" ]; then
    echo "❌ Error: VERCEL_TOKEN environment variable is not set"
    echo "Get your token from: https://vercel.com/account/tokens"
    exit 1
fi

# Check if VERCEL_PROJECT_ID is set
if [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "❌ Error: VERCEL_PROJECT_ID environment variable is not set"
    exit 1
fi

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm ci

echo "🧹 Clearing build cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true
rm -rf .vercel 2>/dev/null || true

echo "🏗️ Building frontend..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Build failed: dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo "📦 Build output:"
ls -lah dist/

# Verify CSS file contains red background
if grep -q "#ff0000" dist/assets/*.css 2>/dev/null; then
    echo "✅ Red background CSS found in build output"
else
    echo "⚠️ Warning: Red background CSS not found in build output"
fi

echo "🚀 Deploying to Vercel..."
vercel --prod --yes --force --token="$VERCEL_TOKEN"

echo "✅ Deployment completed!"

