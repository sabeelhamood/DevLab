# Troubleshooting: Why Real Gemini Questions Aren't Showing

## 🔍 How to Check What's Happening

### 1. **Check Browser Console** (Most Important!)

1. Open your website: https://dev-lab-mocha.vercel.app/
2. Open Browser Developer Tools (F12)
3. Go to **Console** tab
4. Look for these messages:

**✅ If Gemini is configured:**
```
✅ Gemini API is configured in backend.
🔄 Requesting question generation from backend...
✅ Real Gemini question received!
```

**⚠️ If using mock data:**
```
⚠️ Gemini API is not configured in backend. Questions will use mock data.
⚠️ Using mock questions - Gemini API may not be configured or unavailable
```

**❌ If there's an error:**
```
❌ Question loading error: [error details]
❌ Failed to check backend health: [error details]
```

### 2. **Check Backend Health Endpoint**

Visit this URL directly in your browser:
```
https://devlab-backend-production-0bcb.up.railway.app/api/health/detailed
```

Look for:
```json
{
  "services": {
    "gemini": "configured"  // ✅ Good
    // OR
    "gemini": "not configured"  // ❌ Problem!
  }
}
```

### 3. **Check Railway Environment Variables**

1. Go to: https://railway.app/dashboard
2. Select your backend service
3. Go to **Variables** tab
4. Check if `GEMINI_API_KEY` exists and has a real value:
   - ✅ Should be a long string (starts with `AIzaSy...` or similar)
   - ❌ Should NOT be `your-gemini-api-key` or placeholder
   - ❌ Should NOT be empty

## 🐛 Common Issues and Fixes

### Issue 1: Gemini API Key Not Configured

**Symptoms:**
- Console shows: `⚠️ Gemini API is not configured`
- Questions are using mock data
- Health endpoint shows: `"gemini": "not configured"`

**Fix:**
1. Get your Gemini API key from: https://makersuite.google.com/app/apikey
2. Go to Railway → Your Service → Variables
3. Add/Update: `GEMINI_API_KEY` = `your-actual-api-key`
4. Redeploy backend (or wait for auto-redeploy)

### Issue 2: API Key is Placeholder/Invalid

**Symptoms:**
- Console shows: `⚠️ Using mock questions`
- Health endpoint shows: `"isPlaceholder": true`

**Fix:**
1. Check Railway Variables
2. Replace placeholder value with real API key
3. Ensure key is at least 20 characters long
4. Redeploy backend

### Issue 3: CORS Error

**Symptoms:**
- Console shows: `CORS policy: No 'Access-Control-Allow-Origin'`
- Network tab shows CORS error

**Fix:**
- Already fixed! Backend CORS is configured for `dev-lab-mocha.vercel.app`
- If still seeing errors, check backend logs

### Issue 4: Network/API Connection Error

**Symptoms:**
- Console shows: `❌ Failed to check backend health`
- Console shows: `Network Error` or `ECONNREFUSED`

**Fix:**
1. Check if backend is running: https://devlab-backend-production-0bcb.up.railway.app/api/health
2. Check Railway deployment status
3. Check backend logs in Railway dashboard

### Issue 5: Frontend Not Calling Backend

**Symptoms:**
- No console logs about question generation
- Questions never load

**Fix:**
1. Check `VITE_API_URL` in Vercel environment variables
2. Should be: `https://devlab-backend-production-0bcb.up.railway.app`
3. Verify in Vercel dashboard → Settings → Environment Variables

## ✅ Verification Steps

### Step 1: Check Frontend Console
1. Open https://dev-lab-mocha.vercel.app/
2. Open DevTools (F12) → Console
3. Look for health check message
4. Generate a question and check logs

### Step 2: Check Backend Health
Visit: https://devlab-backend-production-0bcb.up.railway.app/api/health/detailed

### Step 3: Check Railway Variables
1. Railway Dashboard → Your Service → Variables
2. Verify `GEMINI_API_KEY` exists and is valid

### Step 4: Test Question Generation
1. On the website, click "Generate New Question"
2. Check console for:
   - `✅ Real Gemini question received!` = Success!
   - `⚠️ Using mock questions` = Gemini not configured

## 📊 Expected Behavior

### ✅ When Gemini is Working:
- Console shows: `✅ Gemini API is configured in backend.`
- Console shows: `✅ Real Gemini question received!`
- Questions are unique and contextual
- Questions have `source: "gemini"` in response

### ⚠️ When Using Mock Data:
- Console shows: `⚠️ Gemini API is not configured`
- Console shows: `⚠️ Using mock questions`
- Questions are generic/template-based
- Questions have `source: "mock"` in response

## 🔧 Quick Fix Checklist

- [ ] Check Railway Variables: `GEMINI_API_KEY` is set
- [ ] Check API key is real (not placeholder)
- [ ] Check backend health endpoint
- [ ] Check browser console for errors
- [ ] Check Vercel `VITE_API_URL` is correct
- [ ] Check backend logs in Railway
- [ ] Try generating a new question

## 📝 Next Steps After Fixing

Once Gemini API key is configured:
1. Wait for backend to redeploy (or trigger manually)
2. Refresh the website
3. Check console - should see `✅ Gemini API is configured`
4. Generate a question - should see `✅ Real Gemini question received!`
5. Questions should now be unique and AI-generated

---

**Last Updated:** After adding debugging features (commit f21824c3)

