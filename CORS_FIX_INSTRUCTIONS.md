# 🔧 CORS Error Fix - Railway Backend Configuration

## ❌ Current Error

```
Access to fetch at 'https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package' from origin 'https://dev-lab-phi.vercel.app' has been blocked by CORS policy
```

## 🎯 Solution: Configure Railway Environment Variables

### Step 1: Access Railway Dashboard
1. Go to: https://railway.app
2. Log in to your account
3. Select the project: `devlab-backend-production`

### Step 2: Add CORS Environment Variable
1. Click on **Settings** tab (or gear icon)
2. Click on **Variables** section
3. Add/Update the following variable:

**Variable Name:**
```
CORS_ORIGINS
```

**Variable Value:**
```
https://dev-lab-phi.vercel.app,https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app,https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app,https://dev-fm3lkx884-sabeels-projects-5df24825.vercel.app,https://dev-gisy8vuij-sabeels-projects-5df24825.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173
```

4. Click **Save** or **Update**

### Step 3: Verify Other Required Variables
Make sure these variables are also set in Railway:

- `NODE_ENV` = `production`
- `PORT` = `3001`
- `GEMINI_API_KEY` = Your Gemini API key
- `CORS_ORIGINS` = (the value above)

### Step 4: Redeploy
1. Railway will automatically redeploy when you save the environment variable
2. Wait 1-2 minutes for the deployment to complete
3. Check the deployment logs to ensure it succeeded

### Step 5: Test the Fix
1. Go to: https://dev-lab-phi.vercel.app
2. Open browser DevTools (F12)
3. Check the Console tab
4. The CORS error should be gone

## 🔍 Verification

After updating, the backend will:
1. Accept requests from your Vercel frontend
2. Return proper CORS headers
3. Allow API calls to succeed

## 📋 Backend Code Reference

The backend CORS configuration is in:
- `backend/src/config/environment.js` - Reads CORS_ORIGINS from environment
- `backend/src/app.js` - Applies CORS middleware

The code already supports this configuration, it just needs the environment variable set in Railway.

## 🆘 If Still Not Working

If after 2-3 minutes you still see CORS errors:

1. **Check Railway Deployment Logs:**
   - Railway Dashboard → Your Project → Deployments
   - Click on latest deployment
   - Look for any errors

2. **Verify Environment Variable:**
   - Go back to Railway Settings → Variables
   - Ensure `CORS_ORIGINS` is exactly as shown above
   - No extra spaces or quotes

3. **Clear Browser Cache:**
   - Press `Ctrl + Shift + R` to hard refresh
   - Or open in Incognito mode

4. **Check Backend Logs:**
   - Railway Dashboard → Your Project → Logs
   - Look for CORS-related log messages

---

**Expected Result:** Your Vercel frontend should successfully communicate with Railway backend without CORS errors.



