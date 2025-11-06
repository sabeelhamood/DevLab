# 📋 Vercel Dashboard Setup Checklist

## ⚠️ CRITICAL: Complete These Steps in Vercel Dashboard

After pushing the code changes, you **MUST** configure the Vercel dashboard correctly for automatic deployments to work.

### Step 1: Verify Project Settings

**Go to:** https://vercel.com/dashboard → Your Project → **Settings** → **General**

#### Root Directory
- ✅ **Set to:** `frontend`
- ❌ **NOT:** (empty) or `/` or `./`

#### Build & Development Settings
- **Build Command:** Leave **EMPTY** (will use `frontend/vercel.json`)
- **Output Directory:** Leave **EMPTY** (will use `frontend/vercel.json`)
- **Install Command:** Leave **EMPTY** (will use `frontend/vercel.json`)
- **Framework Preset:** Select **Vite**

**Why empty?** When you set Root Directory to `frontend`, Vercel automatically looks for `frontend/vercel.json` and uses those settings. Having settings in both places causes conflicts.

### Step 2: Configure Git Integration

**Go to:** https://vercel.com/dashboard → Your Project → **Settings** → **Git**

#### Repository Connection
- ✅ **Connected Repository:** `sabeelhamood/DevLab`
- ✅ **Production Branch:** `main`
- ✅ **Auto-deploy:** **ENABLED** (toggle ON)
- ✅ **Preview Deployments:** **ENABLED** (toggle ON)

#### If Not Connected:
1. Click **"Connect Git Repository"**
2. Select **GitHub**
3. Find and select: `sabeelhamood/DevLab`
4. Configure:
   - **Root Directory:** `frontend`
   - **Production Branch:** `main`
   - **Auto-deploy:** ON
5. Click **"Connect"**

### Step 3: Set Environment Variables

**Go to:** https://vercel.com/dashboard → Your Project → **Settings** → **Environment Variables**

#### Required Variable:
- **Name:** `VITE_API_URL`
- **Value:** `https://devlab-backend-production-0bcb.up.railway.app`
- **Environment:** 
  - ✅ Production
  - ✅ Preview
  - ✅ Development

#### How to Add:
1. Click **"Add New"**
2. Enter name: `VITE_API_URL`
3. Enter value: `https://devlab-backend-production-0bcb.up.railway.app`
4. Select all environments (Production, Preview, Development)
5. Click **"Save"**

**⚠️ IMPORTANT:** After adding/updating environment variables, you need to **redeploy** for changes to take effect.

### Step 4: Verify Deployment Settings

**Go to:** https://vercel.com/dashboard → Your Project → **Deployments**

#### Check Latest Deployment:
1. Look at the **latest deployment**
2. Check **"Source"** - should show GitHub commit
3. Check **"Status"** - should be "Ready" (green)
4. Click on deployment to see **Build Logs**

#### Build Logs Should Show:
```
Cloning repository...
Installing dependencies...
npm install
Building...
npm run build
Uploading build outputs...
Deployment ready
```

### Step 5: Test Automatic Deployment

1. **Make a small change:**
   - Edit `frontend/src/main.jsx`
   - Update build version to test
   - Commit and push to `main`

2. **Watch Vercel Dashboard:**
   - Go to **Deployments** tab
   - Should see new deployment appear automatically
   - Status: "Building" → "Ready"

3. **Verify:**
   - Visit your site
   - Check console for new build version
   - Changes should be visible

### Step 6: Disable Conflicting GitHub Actions (Optional but Recommended)

**Go to:** https://github.com/sabeelhamood/DevLab → **Actions**

#### Option A: Disable Workflows
1. Go to each workflow file:
   - `.github/workflows/deploy.yml`
   - `.github/workflows/production-deploy.yml`
   - `.github/workflows/auto-deploy.yml`
2. Rename to `.yml.disabled` (e.g., `deploy.yml.disabled`)
3. Commit and push

#### Option B: Keep for Manual Triggers
- Leave workflows as-is
- They won't interfere if Vercel native integration is working
- Can be used for manual deployments if needed

**Why disable?** Vercel's native GitHub integration is more reliable and doesn't require GitHub Actions. Multiple deployment methods can cause conflicts.

## ✅ Verification Checklist

After completing all steps:

- [ ] Root Directory set to `frontend`
- [ ] Build/Output/Install commands are EMPTY (using vercel.json)
- [ ] Framework Preset is `Vite`
- [ ] GitHub repository is connected
- [ ] Production branch is `main`
- [ ] Auto-deploy is ENABLED
- [ ] Preview deployments are ENABLED
- [ ] `VITE_API_URL` environment variable is set
- [ ] Environment variable is set for all environments
- [ ] Latest deployment shows GitHub commit as source
- [ ] Build logs show successful build
- [ ] Test deployment works automatically

## 🚨 Common Issues

### Issue: Deployments not triggering automatically

**Solution:**
1. Check Git integration is connected
2. Verify auto-deploy is enabled
3. Check webhook status in GitHub (Settings → Webhooks)
4. Try disconnecting and reconnecting Git repository

### Issue: Build fails

**Solution:**
1. Check build logs for specific errors
2. Verify `package.json` has correct scripts
3. Verify `vite.config.js` is correct
4. Check environment variables are set

### Issue: Changes not appearing

**Solution:**
1. Check deployment status is "Ready"
2. Hard refresh browser (Ctrl+Shift+R)
3. Check browser console for errors
4. Verify build version in console matches latest commit

### Issue: Wrong root directory

**Solution:**
1. Go to Settings → General
2. Set Root Directory to `frontend`
3. Save and redeploy

---

**After completing these steps, automatic deployments should work without deleting/recreating the project!**

