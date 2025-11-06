# Troubleshoot Deployment Failure

## ❌ Error: Frontend Deployment Failed

The GitHub Actions workflow failed. This is usually due to **missing GitHub secrets**.

## 🔍 Step 1: Check the Exact Error

1. Go to: https://github.com/sabeelhamood/DevLab/actions
2. Click on the **failed workflow run** (red X)
3. Click on **"🌐 Deploy Frontend to Vercel"** job
4. Scroll to the **bottom** of the logs
5. Look for the **red error message**

Common errors you might see:
- `❌ VERCEL_TOKEN is missing`
- `❌ VERCEL_PROJECT_ID is missing`
- `Authentication error`
- `Project not found`

## 🛠️ Step 2: Add Missing GitHub Secrets

### Required Secrets:

1. **Go to GitHub Secrets:**
   - Visit: https://github.com/sabeelhamood/DevLab/settings/secrets/actions
   - Click **"New repository secret"**

2. **Add VERCEL_TOKEN:**
   - **Name:** `VERCEL_TOKEN`
   - **How to get it:**
     1. Go to: https://vercel.com/account/tokens
     2. Click **"Create Token"**
     3. Name it: `GitHub Actions`
     4. Copy the token
   - **Value:** Paste the token
   - Click **"Add secret"**

3. **Add VERCEL_PROJECT_ID:**
   - **Name:** `VERCEL_PROJECT_ID`
   - **How to get it:**
     1. Go to: https://vercel.com/dashboard
     2. Select your project (`DevLab` or `dev-lab-phi`)
     3. Go to **Settings** → **General**
     4. Find **"Project ID"** (looks like: `prj_xxxxxxxxxxxxx`)
     5. Copy it
   - **Value:** Paste the Project ID
   - Click **"Add secret"**

4. **Optional: Add VERCEL_ORG_ID** (if needed):
   - **Name:** `VERCEL_ORG_ID`
   - **How to get it:**
     1. Go to: https://vercel.com/dashboard
     2. Click your profile/team name (top right)
     3. The URL or settings will show your Org/Team ID
   - **Value:** Your organization/team ID

## ✅ Step 3: Retry Deployment

After adding secrets:

1. Go back to: https://github.com/sabeelhamood/DevLab/actions
2. Find the failed workflow
3. Click **"Re-run jobs"** → **"Re-run all jobs"**
4. Wait for it to complete (~5-10 minutes)

## 🚀 Alternative Solution: Use Vercel's Native GitHub Integration

If GitHub Actions keeps failing, use Vercel's built-in deployment:

### Option A: Connect Vercel to GitHub (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard

2. **Import Project:**
   - Click **"Add New"** → **"Project"**
   - Click **"Import Git Repository"**
   - Select your GitHub account
   - Find and select: `sabeelhamood/DevLab`
   - Click **"Import"**

3. **Configure Project:**
   - **Framework Preset:** Vite (auto-detected)
   - **Root Directory:** `frontend` ⚠️ **CRITICAL!**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - Click **"Deploy"**

4. **Set Environment Variables:**
   - After deployment, go to **Settings** → **Environment Variables**
   - Add: `VITE_API_URL` = `https://devlab-backend-production-0bcb.up.railway.app`
   - Click **"Save"**

5. **Redeploy:**
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment → **"Redeploy"**
   - Turn OFF **"Use existing Build Cache"**
   - Click **"Redeploy"**

### Benefits of This Approach:
- ✅ No GitHub secrets needed
- ✅ Auto-deploys on every push to `main`
- ✅ Easier to manage
- ✅ Built-in Vercel features

## 📋 Quick Checklist

- [ ] Checked exact error in GitHub Actions logs
- [ ] Added `VERCEL_TOKEN` to GitHub secrets
- [ ] Added `VERCEL_PROJECT_ID` to GitHub secrets
- [ ] Retried deployment OR
- [ ] Set up Vercel native GitHub integration
- [ ] Set Root Directory = `frontend` in Vercel
- [ ] Set `VITE_API_URL` environment variable
- [ ] Redeployed without cache

## 🎯 Recommended Approach

**I recommend using Vercel's native GitHub integration** because:
1. It's simpler - no GitHub secrets needed
2. Auto-deploys on every push
3. Better error messages
4. Easier to manage

Just make sure to set **Root Directory = `frontend`** in Vercel project settings!


