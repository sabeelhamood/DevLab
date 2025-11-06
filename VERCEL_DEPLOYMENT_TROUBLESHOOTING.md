# Vercel Deployment Troubleshooting

## Issue: Changes Not Appearing on Website

If changes pushed to GitHub are not appearing on https://dev-lab-mocha.vercel.app/, follow these steps:

## Step 1: Check Vercel GitHub Integration

### Option A: Vercel Auto-Deploy from GitHub (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project: `dev-lab`
3. Go to **Settings** → **Git**
4. Verify:
   - ✅ GitHub repository is connected
   - ✅ Production branch is set to `main`
   - ✅ Auto-deploy is enabled

If not connected:
1. Click **Connect Git Repository**
2. Select your GitHub repository: `sabeelhamood/DevLab`
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Save and deploy

### Option B: GitHub Actions Deployment

If Vercel GitHub integration is not working, check GitHub Actions:

1. Go to: https://github.com/sabeelhamood/DevLab/actions
2. Check if workflows are running:
   - `Deploy Fullstack Application` (deploy.yml)
   - `Auto Deploy to Vercel and Railway` (auto-deploy.yml)
   - `Production Deployment` (production-deploy.yml)
3. If workflows are failing:
   - Check logs for errors
   - Verify GitHub Secrets are set:
     - `VERCEL_TOKEN`
     - `VERCEL_PROJECT_ID`
     - `VERCEL_ORG_ID`

## Step 2: Manual Deployment via Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select project: `dev-lab`
3. Click **Deployments** tab
4. Click **Redeploy** on the latest deployment
5. Or click **Deploy** → **Deploy Git Repository**

## Step 3: Manual Deployment via Vercel CLI

If you have Vercel CLI installed locally:

```bash
cd frontend
vercel --prod
```

## Step 4: Verify Deployment Status

1. **Vercel Dashboard**: https://vercel.com/dashboard
   - Check latest deployment status
   - Should show "Ready" or "Building"

2. **Check Build Logs**:
   - Click on latest deployment
   - Check "Build Logs" for errors
   - Look for build completion message

3. **Check Domain**:
   - Verify domain: `dev-lab-mocha.vercel.app`
   - Check if deployment is assigned to production

## Step 5: Clear Browser Cache

Even if deployment is successful, browser cache might show old version:

1. **Hard Refresh**:
   - Windows: `Ctrl + Shift + R` or `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Incognito/Private Mode**:
   - Open website in incognito window
   - This bypasses cache

3. **Clear Cache**:
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data

## Step 6: Verify Changes Are in Code

Check if changes are actually in the repository:

1. Go to: https://github.com/sabeelhamood/DevLab
2. Navigate to: `frontend/src/styles/index.css`
3. Verify red background CSS is present:
   ```css
   * {
     background-color: #ff0000 !important;
   }
   ```

## Common Issues

### Issue 1: Vercel Not Connected to GitHub
**Solution**: Connect repository in Vercel Settings → Git

### Issue 2: Wrong Root Directory
**Solution**: Set Root Directory to `frontend` in Vercel project settings

### Issue 3: Build Failing
**Solution**: 
- Check build logs in Vercel dashboard
- Verify `package.json` has correct build script
- Check for dependency errors

### Issue 4: GitHub Actions Not Running
**Solution**:
- Check GitHub Actions tab
- Verify workflow files are in `.github/workflows/`
- Check if workflows are enabled

### Issue 5: Secrets Not Configured
**Solution**:
- Go to GitHub → Settings → Secrets and variables → Actions
- Add required secrets:
  - `VERCEL_TOKEN`
  - `VERCEL_PROJECT_ID`
  - `VERCEL_ORG_ID`

## Quick Fix: Force New Deployment

1. Make a small change (like updating a comment)
2. Commit and push to `main`
3. This should trigger automatic deployment

## Current Status Check

To verify current deployment status:

1. **Latest Commit**: `0f791e85` - "test: force red background everywhere"
2. **Expected Change**: Entire page should be red (`#ff0000`)
3. **Check URL**: https://dev-lab-mocha.vercel.app/

---

**Next Steps**:
1. Check Vercel dashboard for deployment status
2. Verify GitHub integration is connected
3. If needed, manually trigger deployment
4. Clear browser cache and check again

