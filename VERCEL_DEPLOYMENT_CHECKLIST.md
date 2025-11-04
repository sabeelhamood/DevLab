# Vercel Deployment Checklist

## Current Status

**Frontend URL:** https://dev-lab-phi.vercel.app/
**Backend URL:** https://devlab-backend-production.up.railway.app

## Issue: Website Not Loading

If you can't see the website at the Vercel URL, follow these steps:

### Step 1: Verify Vercel Project is Connected

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Check if your project is listed
3. If not, connect your GitHub repository:
   - Click "Add New Project"
   - Select your repository: `sabeelhamood/DevLab`
   - Configure:
     - **Framework Preset:** Vite
     - **Root Directory:** `frontend`
     - **Build Command:** `npm run build`
     - **Output Directory:** `dist`
     - **Install Command:** `npm install`

### Step 2: Verify Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. **Add/Verify** this variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://devlab-backend-production.up.railway.app`
   - **Environments:** Production, Preview, Development (all)
3. **Save** and **Redeploy**

### Step 3: Check Deployment Status

1. Go to Vercel Dashboard → Your Project → Deployments
2. Check the latest deployment:
   - ✅ **Ready** = Deployment successful
   - ⏳ **Building** = Still deploying (wait 2-3 minutes)
   - ❌ **Error** = Check build logs

### Step 4: Check Build Logs

If deployment failed:
1. Click on the failed deployment
2. Check "Build Logs" tab
3. Look for errors:
   - Missing dependencies
   - Build errors
   - Environment variable issues

### Step 5: Trigger Manual Redeploy

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click "..." menu on latest deployment
3. Select "Redeploy"
4. Wait for deployment to complete (2-3 minutes)

### Step 6: Verify Build Output

After successful deployment:
1. Visit: https://dev-lab-phi.vercel.app/
2. You should see the Practice Page
3. Open browser DevTools (F12) → Console tab
4. Check for any errors

## Common Issues

### Issue 1: Blank Page / 404 Error

**Cause:** Vercel routing not configured correctly

**Fix:**
- Ensure `vercel.json` or `frontend/vercel.json` has:
  ```json
  {
    "rewrites": [
      {
        "source": "/(.*)",
        "destination": "/index.html"
      }
    ]
  }
  ```

### Issue 2: API Connection Errors

**Cause:** `VITE_API_URL` not set in Vercel

**Fix:**
- Add `VITE_API_URL` in Vercel Environment Variables
- Value: `https://devlab-backend-production.up.railway.app`
- Redeploy

### Issue 3: Build Fails

**Cause:** Missing dependencies or build errors

**Fix:**
- Check build logs in Vercel
- Ensure `package.json` has all dependencies
- Try building locally: `cd frontend && npm run build`

### Issue 4: Old Version Deployed

**Cause:** Vercel hasn't picked up latest changes

**Fix:**
- Trigger manual redeploy in Vercel Dashboard
- Or push a new commit to trigger auto-deploy

## Quick Test Commands

### Test Local Build:
```powershell
cd frontend
npm run build
npm run preview
```

### Test Production API Connection:
```powershell
# Should return backend health status
curl https://devlab-backend-production.up.railway.app/health
```

## Expected Behavior

When everything is working:
1. ✅ Visit https://dev-lab-phi.vercel.app/ → See Practice Page
2. ✅ Click "Generate New Question" → Question loads
3. ✅ Write code → Can submit and get feedback
4. ✅ Browser console shows no errors

## Next Steps

1. **Check Vercel Dashboard** for deployment status
2. **Verify Environment Variables** are set
3. **Check Build Logs** for any errors
4. **Redeploy** if needed
5. **Test** the website after deployment

---

## Railway Backend Status

The backend is deployed and running at:
- **URL:** https://devlab-backend-production.up.railway.app
- **Health Check:** https://devlab-backend-production.up.railway.app/health

**Note:** The backend logs show a placeholder API key issue. Once you fix `GEMINI_API_KEY` in Railway Service Variables, real questions will be generated.

