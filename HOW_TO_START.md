# How to Start the Website - Quick Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Create Environment Files

**Create `backend/.env` file:**

```env
NODE_ENV=development
PORT=3001

# Database (use placeholders for now)
SUPABASE_URL=https://placeholder.supabase.co
SUPABASE_KEY=placeholder-key
MONGO_URL=mongodb://localhost:27017/devlab-dev

# External APIs (you can add real keys later)
GEMINI_API_KEY=placeholder-key
x-rapidapi-key=your-rapidapi-key-here
x-rapidapi-host=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key
SERVICE_API_KEY=dev-service-api-key
MICROSERVICE_API_KEYS=dev-api-key-1,dev-api-key-2

# Logging
LOG_LEVEL=info
```

**Create `frontend/.env.local` file:**

```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Step 2: Install Dependencies (if not done)

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Step 3: Start Both Servers

**Open TWO terminal windows:**

**Terminal 1 - Backend:**
```bash
cd C:\Users\ThinkPad\Desktop\DevLab\backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd C:\Users\ThinkPad\Desktop\DevLab\frontend
npm run dev
```

### Step 4: Open Browser

Visit: **http://localhost:5173**

---

## ✅ What You Should See

**Backend Terminal:**
```
DEVLAB Backend Server running on port 3001
```

**Frontend Terminal:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Browser:**
- Practice page with code editor
- Question card on the left
- Code editor on the right
- "Run Code" button

---

## 🔧 Troubleshooting

### "Cannot find module" error?
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Port already in use?
- Backend: Change `PORT=3001` in `backend/.env` to another port (e.g., `3002`)
- Frontend: Change port in `frontend/vite.config.js`

### "Missing required environment variables" error?
- Make sure `backend/.env` file exists with all required variables
- Check that variable names match exactly (case-sensitive)

### Can't connect to localhost?
1. Make sure both servers are running
2. Try `http://127.0.0.1:5173` instead of `localhost`
3. Check Windows Firewall isn't blocking ports

---

## 📝 Quick Checklist

- [ ] `backend/.env` file created
- [ ] `frontend/.env.local` file created
- [ ] Dependencies installed (`npm install` in both folders)
- [ ] Backend server running (Terminal 1)
- [ ] Frontend server running (Terminal 2)
- [ ] Browser opened to http://localhost:5173

---

## 🎯 Test It Works

1. **Backend Health Check:**
   - Open: http://localhost:3001/health
   - Should see: `{"status":"ok",...}`

2. **Frontend:**
   - Open: http://localhost:5173
   - Should see: Practice page with code editor

---

**Ready! Follow the steps above to start the website.** 🚀

