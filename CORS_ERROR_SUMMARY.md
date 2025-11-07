# CORS Error Explanation & Solution

## 🔴 Error Messages You're Seeing

1. **CORS Error:**

   ```
   Access to fetch at 'https://devlab-backend-production-0bcb.up.railway.app/api/gemini-questions/generate-question-package' from origin 'https://dev-lab-phi.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
   ```

2. **Failed to Fetch:**
   ```
   Failed to load resource: net::ERR_FAILED
   ```

## 🔍 What is CORS?

**CORS** (Cross-Origin Resource Sharing) is a browser security feature that blocks requests from one
website to another unless the server explicitly allows it.

In your case:

- **Frontend:** Running on `https://dev-lab-phi.vercel.app` (Vercel)
- **Backend:** Running on `https://devlab-backend-production-0bcb.up.railway.app` (Railway)
- **Problem:** Railway backend is not telling the browser to allow requests from Vercel

## ✅ The Solution

Your backend code is configured correctly, but the **Railway environment variable is missing**.

### What You Need to Do:

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Select your backend project

2. **Add Environment Variable:**
   - Go to: Settings → Variables
   - Add: `CORS_ORIGINS`
   - Value:
     ```
     https://dev-lab-phi.vercel.app,https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app,https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app,http://localhost:3000,http://localhost:3001,http://localhost:5173
     ```

3. **Wait for Redeploy:**
   - Railway automatically redeploys when you save
   - Takes 1-2 minutes

4. **Test:**
   - Refresh: https://dev-lab-phi.vercel.app
   - The CORS error should be gone

## 📝 Why This Happened

Your backend code in `backend/src/app.js` already has CORS configuration:

```javascript
const allowedOrigins = [
  'https://dev-lab-phi.vercel.app',
  // ... more origins
];
```

However, it also reads from environment variable:

```javascript
...(config.security?.corsOrigins || [])
```

The `config.security.corsOrigins` comes from `CORS_ORIGINS` environment variable in
`backend/src/config/environment.js`:

```javascript
corsOrigins: process.env['CORS_ORIGINS']?.split(',') || [...]
```

So when `CORS_ORIGINS` is not set in Railway, your Vercel frontend URL is not in the allowed list.

## 🎯 Quick Fix Steps

1. Open Railway Dashboard → Your Project
2. Go to Settings → Variables
3. Add: `CORS_ORIGINS` = (copy the value from CORS_FIX_INSTRUCTIONS.md)
4. Save and wait 2 minutes
5. Refresh your Vercel app

Done! ✨
