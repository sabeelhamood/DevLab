# How to Start the Servers

## ✅ Status

- ✅ Backend dependencies: INSTALLED
- ✅ Frontend dependencies: INSTALLED  
- ✅ Environment files: CREATED

## 🚀 Start the Application

### Option 1: Manual Start (Recommended for Testing)

**Open TWO separate terminal windows:**

#### Terminal 1 - Backend Server

```bash
cd C:\Users\ThinkPad\Desktop\DevLab\backend
npm run dev
```

**Expected output:**
```
DEVLAB Backend Server running on port 3001
Connected to Supabase
Connected to MongoDB
```

**Note**: If you see database connection errors, that's OK for now. The server will still start, but some features won't work until you configure real database URLs.

#### Terminal 2 - Frontend Server

```bash
cd C:\Users\ThinkPad\Desktop\DevLab\frontend
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Option 2: Quick Test (Verify Everything Works)

**Test Backend Health Check:**
```bash
curl http://localhost:3001/health
```

Or open in browser: http://localhost:3001/health

**Test API Root:**
```bash
curl http://localhost:3001/
```

Or open in browser: http://localhost:3001/

### 🌐 Open the Application

Once both servers are running, open your browser and go to:

**http://localhost:5173**

---

## 🔧 Troubleshooting

### Backend won't start?

**Check:**
1. Is port 3001 already in use?
   ```bash
   netstat -ano | findstr :3001
   ```
2. Does `backend/.env` file exist?
3. Check error messages in terminal

**Common fixes:**
- Change PORT in `.env` if 3001 is busy
- Make sure `.env` file is in `backend/` folder
- Check Node.js version: `node --version` (should be 18+)

### Frontend won't start?

**Check:**
1. Is port 5173 already in use?
2. Does `frontend/.env.local` file exist?
3. Check error messages in terminal

**Common fixes:**
- Change port in `vite.config.js` if 5173 is busy
- Make sure `.env.local` file is in `frontend/` folder
- Clear Vite cache: `cd frontend && rm -rf node_modules/.vite`

### Can't connect to localhost?

**Check:**
1. Are both servers running?
2. Check if ports are correct:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:5173
3. Try `http://127.0.0.1:5173` instead of `localhost`

### Database connection errors?

**This is OK for basic testing!** The app will still work for:
- Viewing the UI
- Testing navigation
- Testing theme toggle
- Basic functionality

**To fix database errors:**
1. Set up Supabase account (free tier)
2. Set up MongoDB Atlas (free tier)
3. Update `backend/.env` with real URLs

---

## 📋 Quick Checklist

- [ ] Backend server started (Terminal 1)
- [ ] Frontend server started (Terminal 2)
- [ ] Backend health check works: http://localhost:3001/health
- [ ] Frontend loads: http://localhost:5173
- [ ] No critical errors in terminals

---

## 🎯 What You Should See

**In Browser (http://localhost:5173):**
- DEVLAB header with logo
- Navigation menu (Practice, Competition)
- Theme toggle button (sun/moon icon)
- Practice page content

**If you see errors:**
- Check both terminal windows for error messages
- Verify environment files exist
- Check that ports aren't blocked by firewall

---

**Ready to start! Follow the steps above.** 🚀



