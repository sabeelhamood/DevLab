# Force Vercel to Deploy Latest Localhost Version

## ✅ Latest Changes Pushed
- Commit: `206f6b8f` - "Fix Vercel config: Set rootDirectory to frontend and add build version marker"
- All localhost code is now in GitHub

## 🔧 CRITICAL: Vercel Dashboard Configuration

**You MUST configure Vercel dashboard settings manually:**

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Select your project: `DevLab` or `dev-lab-phi`

### Step 2: Set Root Directory (MOST IMPORTANT)
1. Go to **Settings** → **General**
2. Scroll to **Root Directory**
3. Click **"Edit"**
4. Set to: `frontend`
5. Click **"Save"**

**This is the #1 reason why Vercel shows old version!**

### Step 3: Verify Build Settings
In **Settings** → **General**, verify:
- **Framework Preset:** Vite (auto-detected)
- **Build Command:** `npm run build` (should auto-detect)
- **Output Directory:** `dist` (should auto-detect)
- **Install Command:** `npm install` (should auto-detect)

### Step 4: Force Fresh Deployment
1. Go to **Deployments** tab
2. Find the latest deployment (should be from commit `206f6b8f`)
3. Click **"..."** menu → **"Redeploy"**
4. **IMPORTANT:** Turn OFF **"Use existing Build Cache"**
5. Click **"Redeploy"**

### Step 5: Verify Deployment
After deployment completes:

1. Visit: https://dev-lab-phi.vercel.app/
2. Open browser DevTools (F12) → Console tab
3. You should see:
   ```
   🚀 DEVLAB Frontend - Build Version: 2024-01-15-v2
   🌐 Environment: Production
   📡 API URL: https://devlab-backend-production-0bcb.up.railway.app
   ```

If you see this in console, the new version is deployed!

## 🔄 Alternative: Use GitHub Actions

If Vercel dashboard configuration doesn't work:

1. Go to: https://github.com/sabeelhamood/DevLab/actions
2. Select **"🚀 Production Deployment - Frontend to Vercel & Backend to Railway"**
3. Click **"Run workflow"**
4. Select branch: `main`
5. Click **"Run workflow"**

This will deploy using Vercel CLI from the `frontend` directory.

## 🐛 Troubleshooting

### If you still see old version:

1. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in Incognito/Private window

2. **Check Deployment Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on the deployment
   - Check "Build Logs" for errors
   - Check "Function Logs" for runtime errors

3. **Verify Environment Variables:**
   - Go to Settings → Environment Variables
   - Ensure `VITE_API_URL` = `https://devlab-backend-production-0bcb.up.railway.app` (without `/api`)

4. **Check Root Directory:**
   - Go to Settings → General
   - Verify Root Directory = `frontend`
   - If not set, this is likely the issue!

## 📊 Current Status

- ✅ Code pushed to GitHub: Commit `206f6b8f`
- ✅ Build works locally: Verified
- ✅ Vercel config updated: `vercel.json` with `rootDirectory: "frontend"`
- ⚠️ **Action Required:** Set Root Directory in Vercel Dashboard

## 🎯 Next Steps

1. **Set Root Directory in Vercel Dashboard** (CRITICAL!)
2. **Redeploy without cache**
3. **Verify build version in browser console**
4. **Test the website matches localhost**

