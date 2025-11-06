# GitHub Actions Deployment Setup

This document explains the GitHub Actions CI/CD pipeline configuration for automatic deployment.

## 🚀 Workflow Overview

The project uses GitHub Actions to automatically:
1. **Run tests** on every push and pull request
2. **Deploy frontend to Vercel** when pushing to `main` branch
3. **Deploy backend to Railway** when pushing to `main` branch

## 📋 Workflow Files

### `.github/workflows/deploy.yml`
Main CI/CD pipeline that:
- Runs tests for both frontend and backend
- Deploys frontend to Vercel (production)
- Deploys backend to Railway (production)
- Generates deployment summary

### `.github/workflows/test.yml`
Dedicated test workflow that runs:
- Backend unit tests
- Frontend unit tests
- E2E tests (if configured)

## 🔐 Required GitHub Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

### Vercel Secrets (Frontend Deployment)

1. **VERCEL_TOKEN**
   - Get from: Vercel Dashboard → Settings → Tokens
   - Create a new token with deployment permissions
   - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

2. **VERCEL_PROJECT_ID**
   - Get from: Vercel Dashboard → Your Project → Settings → General
   - Copy the Project ID
   - Add to GitHub secrets

3. **VERCEL_ORG_ID** (Optional)
   - Get from: Vercel Dashboard → Settings → General
   - Only needed if you're part of a team/organization
   - Add to GitHub secrets if applicable

### Railway Secrets (Backend Deployment)

1. **RAILWAY_TOKEN**
   - Get from: Railway Dashboard → Account Settings → Tokens
   - Create a new token with deployment permissions
   - Add to GitHub secrets

2. **RAILWAY_PROJECT_ID**
   - Get from: Railway Dashboard → Your Project → Settings
   - Copy the Project ID
   - Add to GitHub secrets

3. **RAILWAY_SERVICE_ID** (Optional but recommended)
   - Get from: Railway Dashboard → Your Service → Settings
   - Copy the Service ID
   - Add to GitHub secrets for more precise deployments

4. **GEMINI_API_KEY** (Optional)
   - Only needed if you want to override Railway's environment variable
   - Usually managed directly in Railway dashboard
   - Add to GitHub secrets only if needed

## 📝 How to Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name (e.g., `VERCEL_TOKEN`)
5. Enter the secret value
6. Click **Add secret**

## 🔄 Workflow Triggers

The deployment workflow triggers on:
- **Push to `main` branch** → Runs tests and deploys to production
- **Pull requests to `main`** → Runs tests only (no deployment)
- **Manual trigger** → Use "workflow_dispatch" in Actions tab

## 🧪 Test Workflow

The test workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

## 📊 Deployment Process

When you push to `main`:

1. **Test Phase** (parallel):
   - Backend tests run
   - Frontend tests run

2. **Deployment Phase** (after tests pass):
   - Frontend builds and deploys to Vercel
   - Backend deploys to Railway

3. **Summary Phase**:
   - Deployment status summary is generated
   - URLs are displayed in the workflow summary

## 🔍 Monitoring Deployments

1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select the workflow run to see:
   - Test results
   - Deployment status
   - Deployment URLs
   - Any errors or warnings

## 🛠️ Troubleshooting

### Deployment Fails

1. **Check Secrets**: Ensure all required secrets are set correctly
2. **Check Logs**: Review the workflow logs in the Actions tab
3. **Verify Permissions**: Ensure tokens have correct permissions
4. **Check Service Status**: Verify Vercel and Railway services are accessible

### Tests Fail

1. **Check Test Logs**: Review test output in workflow logs
2. **Run Tests Locally**: Ensure tests pass locally before pushing
3. **Check Environment Variables**: Some tests may need environment variables

### Vercel Deployment Issues

- Verify `VERCEL_TOKEN` has deployment permissions
- Check `VERCEL_PROJECT_ID` matches your project
- Ensure frontend builds successfully locally

### Railway Deployment Issues

- Verify `RAILWAY_TOKEN` is valid and not expired
- Check `RAILWAY_PROJECT_ID` and `RAILWAY_SERVICE_ID` are correct
- Ensure backend has all required environment variables in Railway dashboard

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)

## ✅ Verification Checklist

After setting up secrets, verify:

- [ ] All required secrets are added to GitHub
- [ ] Test workflow runs successfully on PR
- [ ] Deployment workflow runs on push to main
- [ ] Frontend deploys to Vercel successfully
- [ ] Backend deploys to Railway successfully
- [ ] Deployment URLs are accessible
- [ ] Integration between frontend and backend works

---

**Note**: The first deployment may take longer as dependencies are installed. Subsequent deployments will be faster due to caching.

