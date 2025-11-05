# Vercel Deployment Guide

## Current Status
- ✅ All code committed and pushed to `main` branch
- ✅ Latest commit: `1209dad1` - "Trigger fresh Vercel deployment"
- ✅ Frontend builds successfully locally

## Vercel Configuration Required

### 1. Check Vercel Project Settings

Go to your Vercel Dashboard: https://vercel.com/dashboard

1. Select your project: `DevLab` or `dev-lab-phi`
2. Go to **Settings** → **General**

### 2. Verify Root Directory

**CRITICAL:** Vercel needs to know the frontend is in a subdirectory:

- **Root Directory:** Should be set to `frontend` OR left empty if Vercel detects it automatically
- **Framework Preset:** Vite
- **Build Command:** `npm run build` (should be auto-detected)
- **Output Directory:** `dist` (should be auto-detected)
- **Install Command:** `npm install` (should be auto-detected)

### 3. Verify Environment Variables

Go to **Settings** → **Environment Variables**

Ensure these are set:
```
VITE_API_URL=https://devlab-backend-production-0bcb.up.railway.app
```

**Important:** Do NOT include `/api` at the end!

### 4. Verify Git Integration

Go to **Settings** → **Git**

- **Production Branch:** Should be `main`
- **Auto-deploy:** Should be enabled
- **Repository:** Should be connected to `sabeelhamood/DevLab`

### 5. Manual Redeploy (If Needed)

If auto-deploy didn't trigger:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu → **"Redeploy"**
4. Select **"Use existing Build Cache"** = OFF (to force fresh build)
5. Click **"Redeploy"**

## Troubleshooting

### If Vercel shows old version:

1. **Clear Build Cache:**
   - Go to Deployment → Settings → Clear Build Cache
   - Or redeploy without cache (see step 5 above)

2. **Check Build Logs:**
   - Go to Deployment → Click on the deployment
   - Check "Build Logs" tab
   - Look for any errors

3. **Verify Root Directory:**
   - If Vercel is building from root, it won't find the frontend
   - Set Root Directory to `frontend` in project settings

4. **Force Fresh Deployment:**
   - Delete `.vercel` folder if it exists (shouldn't be committed)
   - Make a new commit and push
   - Or manually trigger redeploy without cache

## GitHub Actions Alternative

If Vercel auto-deploy isn't working, GitHub Actions can deploy:

1. Go to: https://github.com/sabeelhamood/DevLab/actions
2. Select **"🚀 Production Deployment"** workflow
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

This will deploy via Vercel CLI using GitHub Actions.

## Verification

After deployment:

1. Visit: https://dev-lab-phi.vercel.app/
2. Open browser DevTools → Network tab
3. Check that API calls go to: `https://devlab-backend-production-0bcb.up.railway.app/api/...`
4. Verify the site matches your localhost version

## Current Commit Info

- Latest commit: `1209dad1`
- Branch: `main`
- Status: Pushed to GitHub ✅

