# Vercel Setup Instructions

## Current Configuration

Your Vercel project should be configured with these settings:

### Required Vercel Dashboard Settings

1. **Go to Vercel Dashboard** → Your Project → Settings → General

2. **Set Root Directory:**
   - **Root Directory:** `frontend`
   - This tells Vercel to build from the `frontend` folder

3. **Framework Preset:**
   - **Framework Preset:** Vite
   - Vercel should auto-detect this

4. **Build & Output Settings:**
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

### Environment Variables

1. **Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Add/Verify:**
   - **Name:** `VITE_API_URL`
   - **Value:** `https://devlab-backend-production.up.railway.app`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development

3. **Save** and **Redeploy**

## Quick Fix Steps

### Step 1: Update Root Directory in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **General**
4. Scroll to **Root Directory**
5. Set it to: `frontend`
6. Click **Save**

### Step 2: Verify Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Verify `VITE_API_URL` exists:
   - Value: `https://devlab-backend-production.up.railway.app`
   - If missing, add it for all environments

### Step 3: Trigger Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

## After Redeploy

Visit: https://dev-lab-phi.vercel.app/

You should see:
- ✅ Practice Page loads
- ✅ Can generate questions
- ✅ Code editor works

## Troubleshooting

### If you see "404 Not Found" or blank page:

1. **Check Root Directory is set to `frontend`**
2. **Check deployment logs** for build errors
3. **Verify `VITE_API_URL` is set** in Environment Variables

### If you see build errors:

1. Go to **Deployments** → Click failed deployment
2. Check **Build Logs** tab
3. Common issues:
   - Missing dependencies → Check `package.json`
   - Build command fails → Check `npm run build` works locally
   - Environment variable missing → Add `VITE_API_URL`

### If site loads but API calls fail:

1. Check browser console (F12) for errors
2. Verify `VITE_API_URL` value is correct
3. Check Railway backend is running: https://devlab-backend-production.up.railway.app/health

## Verification

After setup, test:
1. Visit: https://dev-lab-phi.vercel.app/
2. Click "Generate New Question"
3. Should load a question (may be mock if Gemini API key not set)
4. Check browser console (F12) for any errors

## Current Status

- ✅ Backend: Deployed on Railway
- ✅ Frontend: Code is ready, needs Vercel configuration
- ⚠️ **Action Required:** Set Root Directory to `frontend` in Vercel Dashboard

