# 🚂 Railway Deployment Setup Guide

## 📋 **Required Railway Configuration**

### **1. Service Variables in Railway Dashboard**

Go to your Railway project → Settings → Variables and add:

```
NODE_ENV = production
PORT = 3001
CORS_ORIGINS = https://dev-lab-phi.vercel.app,https://dev-lab-git-main-sabeels-projects-5df24825.vercel.app,https://dev-jsj0ymr4z-sabeels-projects-5df24825.vercel.app
GEMINI_API_KEY = [Your Gemini API Key]
```

### **2. Railway Target Port Configuration**

In Railway Dashboard → Your Service → Settings → Networking:
- **Target Port**: `3001`
- **Public Networking**: Enabled

### **3. Get Your Railway Backend URL**

After deployment, your Railway backend URL will be:
- Format: `https://[service-name].up.railway.app`
- Example: `https://devlab-production.up.railway.app`

## 🔧 **Frontend Configuration**

### **1. Update Vercel Environment Variables**

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```
VITE_API_URL = https://[YOUR_RAILWAY_URL]/api
```

Replace `[YOUR_RAILWAY_URL]` with your actual Railway backend URL.

### **2. Redeploy Frontend**

After setting the environment variable:
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger automatic deployment

## 🧪 **Testing Your Deployment**

### **1. Test Backend Health**
```bash
curl https://[YOUR_RAILWAY_URL]/health
```

### **2. Test API Endpoints**
```bash
curl https://[YOUR_RAILWAY_URL]/api/health
```

### **3. Test Frontend-Backend Communication**
1. Visit your Vercel frontend URL
2. Check browser console for API errors
3. Test question generation functionality

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors**: Check that your Vercel URL is in `CORS_ORIGINS`
2. **Port Issues**: Ensure Railway Target Port is set to `3001`
3. **Environment Variables**: Verify all variables are set correctly
4. **API Connection**: Check that `VITE_API_URL` points to correct Railway URL

### **Debug Commands:**

```bash
# Check Railway deployment status
railway status

# Check Railway logs
railway logs

# Check environment variables
railway variables
```

## 📊 **Expected Results**

✅ **Backend**: Running on Railway with PORT=3001  
✅ **Frontend**: Deployed on Vercel with correct API URL  
✅ **CORS**: Configured for Vercel frontend  
✅ **Communication**: Frontend ↔ Backend working  

## 🎯 **Final URLs**

- **Frontend**: https://dev-lab-phi.vercel.app/
- **Backend**: https://[YOUR_RAILWAY_URL]
- **API**: https://[YOUR_RAILWAY_URL]/api

---

**Note**: Replace `[YOUR_RAILWAY_URL]` with your actual Railway deployment URL.
