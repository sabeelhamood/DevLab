# Vercel Deployment Fix

## 🔧 Issue
GitHub Actions deployment to Vercel is failing with exit code 1.

## ✅ Fixes Applied

### 1. **Explicit Project Configuration**
- Updated workflow to read project ID and org ID from `.vercel/project.json`
- Copies `.vercel` folder to `frontend/` directory so Vercel CLI can detect it
- Uses explicit `--scope` parameter with org ID

### 2. **Improved Error Handling**
- Added better logging to see what's happening
- Fallback deployment method if project.json not found

## 🔍 Common Issues & Solutions

### Issue 1: Missing VERCEL_TOKEN
**Symptom:** Deployment fails immediately with authentication error

**Solution:**
1. Go to: https://github.com/sabeelhamood/DevLab/settings/secrets/actions
2. Add `VERCEL_TOKEN` secret:
   - Get token from: https://vercel.com/account/tokens
   - Create new token with full access
   - Add to GitHub secrets

### Issue 2: Vercel CLI Can't Find Project
**Symptom:** "Project not found" or "No project linked"

**Solution:**
The workflow now copies `.vercel/project.json` to the frontend directory. If this still fails, try:

1. **Manual Link (Alternative):**
   ```bash
   cd frontend
   vercel link --yes --token=$VERCEL_TOKEN
   ```

2. **Or use explicit project flag:**
   ```bash
   vercel --prod --yes --token=$VERCEL_TOKEN --project=prj_ikobrrZXYGGvVwLGZTAVpoJgQ46j
   ```

### Issue 3: Permission Denied
**Symptom:** "Permission denied" or "Access denied"

**Solution:**
- Ensure VERCEL_TOKEN has deployment permissions
- Check that the token is for the correct Vercel account
- Verify org ID matches your Vercel team

### Issue 4: Build Fails Before Deployment
**Symptom:** Build step fails

**Solution:**
- Check build logs in GitHub Actions
- Verify `npm run build` works locally
- Check for missing dependencies

## 🚀 Alternative Deployment Methods

### Method 1: Use Vercel GitHub Integration (Recommended)
Instead of GitHub Actions, you can use Vercel's built-in GitHub integration:

1. Go to Vercel Dashboard → Your Project → Settings → Git
2. Connect to GitHub repository
3. Vercel will auto-deploy on every push to `main`

**Pros:**
- Automatic deployments
- No need for VERCEL_TOKEN in GitHub
- Built-in preview deployments

**Cons:**
- Less control over deployment process
- Can't customize build steps as easily

### Method 2: Use Vercel Action (GitHub Action)
Replace the CLI deployment with the official Vercel action:

```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v20
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./frontend
```

### Method 3: Manual Deployment via API
Use Vercel REST API to trigger deployment:

```bash
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"projectId": "prj_ikobrrZXYGGvVwLGZTAVpoJgQ46j"}'
```

## 📋 Current Workflow Status

**Latest Fix:** Copy `.vercel/project.json` to frontend directory before deployment

**What It Does:**
1. Reads project ID and org ID from `.vercel/project.json`
2. Copies the config to `frontend/.vercel/` directory
3. Deploys using `vercel --prod --yes --token --scope`

## 🔍 Debugging Steps

1. **Check GitHub Actions Logs:**
   - Go to: https://github.com/sabeelhamood/DevLab/actions
   - Click on latest failed run
   - Check "Deploy Frontend to Vercel" job logs
   - Look for specific error messages

2. **Verify Secrets:**
   ```bash
   # In GitHub Actions, add this step to debug:
   - name: Debug Secrets
     run: |
       echo "Token exists: $([ -n "${{ secrets.VERCEL_TOKEN }}" ] && echo 'yes' || echo 'no')"
   ```

3. **Test Locally:**
   ```bash
   cd frontend
   npm install -g vercel@latest
   vercel --prod --yes --token=YOUR_TOKEN
   ```

4. **Check Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Check project settings
   - Verify project ID matches: `prj_ikobrrZXYGGvVwLGZTAVpoJgQ46j`

## ✅ Next Steps

1. **Wait for New Deployment:**
   - The latest fix has been pushed
   - GitHub Actions will run automatically
   - Check the latest workflow run

2. **If Still Failing:**
   - Check the specific error in GitHub Actions logs
   - Verify VERCEL_TOKEN is set correctly
   - Consider using Vercel's GitHub integration instead

3. **Verify Success:**
   - Check Vercel dashboard for new deployment
   - Visit https://dev-lab-phi.vercel.app/
   - Verify UI matches localhost

---

**Last Updated:** After deployment fix (commit 0c05dace)

