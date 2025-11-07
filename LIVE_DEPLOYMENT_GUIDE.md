# 🚀 LIVE DEPLOYMENT GUIDE - DEVLAB

## 🎯 **YOUR LIVE URLs (After Setup)**

- **Frontend:** `https://devlab-frontend.vercel.app`
- **Backend:** `https://devlab-backend.railway.app`
- **Test Questions:** `https://devlab-frontend.vercel.app/practice`

## ⚡ **QUICK DEPLOYMENT (5 Minutes)**

### **Step 1: Deploy Frontend to Vercel**

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import from GitHub:** `sabeelhamood/DevLab`
4. **Configure:**
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables:**
   ```
   VITE_API_URL=https://devlab-backend.railway.app
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
6. **Click "Deploy"**

### **Step 2: Deploy Backend to Railway**

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project"**
3. **Deploy from GitHub:** `sabeelhamood/DevLab`
4. **Configure:**
   - **Root Directory:** `backend`
   - **Start Command:** `npm start`
5. **Environment Variables:**
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NODE_ENV=production
   PORT=3001
   CORS_ORIGINS=https://devlab-frontend.vercel.app
   ```
6. **Click "Deploy"**

## 🧪 **TEST YOUR DEPLOYMENT**

### **Frontend Test**

```bash
curl https://devlab-frontend.vercel.app
```

### **Backend Test**

```bash
curl https://devlab-backend.railway.app/health
```

### **Gemini AI Test**

```bash
curl -X POST https://devlab-backend.railway.app/api/gemini-test/test-simple
```

## 🎮 **TRY SOLVING QUESTIONS**

Once deployed, visit: **https://devlab-frontend.vercel.app/practice**

### **Available Features:**

- ✅ **AI-Generated Coding Questions**
- ✅ **Real-time Code Evaluation**
- ✅ **Progressive Hints System**
- ✅ **Multiple Difficulty Levels**
- ✅ **JavaScript, Python, Java Support**

### **Question Types:**

1. **Coding Challenges** - Write functions, algorithms
2. **Theoretical Questions** - Multiple choice concepts
3. **Debugging Tasks** - Fix broken code
4. **System Design** - Architecture problems

## 🔧 **MANUAL DEPLOYMENT COMMANDS**

If you prefer command line:

### **Vercel (Frontend)**

```bash
cd frontend
vercel login
vercel --prod
```

### **Railway (Backend)**

```bash
cd backend
railway login
railway up
```

## 📊 **MONITOR DEPLOYMENT**

- **Vercel Dashboard:** [vercel.com/dashboard](https://vercel.com/dashboard)
- **Railway Dashboard:** [railway.app/dashboard](https://railway.app/dashboard)
- **GitHub Actions:**
  [github.com/sabeelhamood/DevLab/actions](https://github.com/sabeelhamood/DevLab/actions)

## 🎯 **SUCCESS INDICATORS**

✅ Frontend loads at Vercel URL  
✅ Backend responds at Railway URL  
✅ Gemini AI generates questions  
✅ CORS allows frontend-backend communication  
✅ Environment variables loaded correctly

## 🚨 **TROUBLESHOOTING**

### **If Frontend Doesn't Load:**

1. Check Vercel deployment logs
2. Verify environment variables
3. Check build process

### **If Backend Doesn't Respond:**

1. Check Railway deployment logs
2. Verify environment variables
3. Check health endpoint

### **If Gemini AI Fails:**

1. Verify GEMINI_API_KEY is set
2. Check API key permissions
3. Test with curl command

## 🎉 **FINAL RESULT**

After successful deployment, you'll have:

- **Live DEVLAB Application** with AI-powered learning
- **Real-time Question Generation** using Gemini AI
- **Intelligent Code Evaluation** and feedback
- **Progressive Learning System** with hints
- **Secure API Integration** with environment variables

## 🔗 **YOUR LIVE APPLICATION**

**Main URL:** `https://devlab-frontend.vercel.app`  
**Practice Page:** `https://devlab-frontend.vercel.app/practice`  
**API Endpoint:** `https://devlab-backend.railway.app/api`

Start solving questions and experience AI-powered learning! 🚀
