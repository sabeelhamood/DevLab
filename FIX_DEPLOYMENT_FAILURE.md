# Fix Deployment Failure

## ❌ Error: Frontend Deployment Failed

The GitHub Actions workflow failed during frontend deployment to Vercel.

## 🔍 Common Causes & Solutions

### 1. Missing or Invalid Vercel Secrets

**Error would show:** "VERCEL_TOKEN is missing" or authentication errors

**Fix:**
1. Go to: https://github.com/sabeelhamood/DevLab/settings/secrets/actions
2. Check if these secrets exist:
   - `VERCEL_TOKEN` - Your Vercel API token
   - `VERCEL_PROJECT_ID` - Your Vercel project ID
   - `VERCEL_ORG_ID` - (Optional) Your Vercel organization ID

3. If missing, add them:
   - **Get VERCEL_TOKEN:** 
     - Go to https://vercel.com/account/tokens
     - Create a new token
     - Copy and add as `VERCEL_TOKEN` secret
   
   - **Get VERCEL_PROJECT_ID:**
     - Go to https://vercel.com/dashboard
     - Select your project
     - Go to Settings → General
     - Copy the "Project ID"
     - Add as `VERCEL_PROJECT_ID` secret

### 2. Build Errors

**Error would show:** Build failures, npm errors, syntax errors

**Fix:**
- Check the build logs in GitHub Actions
- Look for specific error messages
- Fix any code issues
- Test build locally: `cd frontend && npm run build`

### 3. Vercel CLI Authentication Issues

**Error would show:** "Authentication error" or "Invalid token"

**Fix:**
- Regenerate VERCEL_TOKEN
- Ensure token has correct permissions
- Update the secret in GitHub

### 4. Project Not Found

**Error would show:** "Project not found" or "Project ID invalid"

**Fix:**
- Verify VERCEL_PROJECT_ID is correct
- Check project exists in Vercel dashboard
- Ensure project is connected to the GitHub repo

## 🔍 How to Find the Exact Error

1. Go to: https://github.com/sabeelhamood/DevLab/actions
2. Click on the failed workflow run
3. Click on "🌐 Deploy Frontend to Vercel" (red X)
4. Scroll down to see the error logs
5. Look for red error messages at the bottom

## 🛠️ Quick Fix Steps

### Step 1: Check the Error Logs
- Go to GitHub Actions → Failed workflow → Frontend job → Scroll to bottom
- Copy the exact error message

### Step 2: Verify Secrets
- Go to: https://github.com/sabeelhamood/DevLab/settings/secrets/actions
- Ensure all required secrets exist

### Step 3: Test Build Locally
```bash
cd frontend
npm install
npm run build
```
- If this fails, fix the build errors first

### Step 4: Retry Deployment
- Fix any issues found
- Go back to GitHub Actions
- Click "Re-run jobs" on the failed workflow
- Or trigger a new workflow run

## 📋 Required GitHub Secrets

Make sure these are set in GitHub:
- ✅ `VERCEL_TOKEN`
- ✅ `VERCEL_PROJECT_ID`
- ⚠️ `VERCEL_ORG_ID` (optional, but may be needed)

## 🚀 Alternative: Use Vercel's GitHub Integration

If GitHub Actions keeps failing, you can:

1. **Connect Vercel to GitHub directly:**
   - Go to https://vercel.com/dashboard
   - Import your GitHub repo
   - Vercel will auto-deploy on every push

2. **Set Root Directory:**
   - In Vercel project settings → General
   - Set Root Directory = `frontend`

3. **This bypasses GitHub Actions** and uses Vercel's native deployment

