# 🚀 How to Start the Website - Step by Step

## Quick Start Guide

### Step 1: Open PowerShell/Terminal

Open **TWO separate terminal windows** (PowerShell or Command Prompt)

---

### Step 2: Start Backend Server (Terminal 1)

In **Terminal 1**, run:

```powershell
cd C:\Users\ThinkPad\Desktop\DevLab\backend
npm run dev
```

**Wait for:** You should see:
```
DEVLAB Backend Server running on port 3001
```

**If you see errors:**
- Check that `backend/.env` file exists
- Make sure all required environment variables are set
- Check if port 3001 is already in use

---

### Step 3: Start Frontend Server (Terminal 2)

In **Terminal 2**, run:

```powershell
cd C:\Users\ThinkPad\Desktop\DevLab\frontend
npm run dev
```

**Wait for:** You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**If you see errors:**
- Check that `frontend/.env.local` file exists
- Make sure `VITE_API_URL=http://localhost:3001` is set
- Check if port 5173 is already in use

---

### Step 4: Open Website in Browser

Once **BOTH** servers are running, open your browser and go to:

**👉 http://localhost:5173**

---

## ✅ What You'll See

When you open http://localhost:5173, you should see:

1. **Header** - DEVLAB logo and navigation
2. **Practice Page** with:
   - **Left side**: Question card (may be empty initially)
   - **Right side**: Code editor with Monaco Editor
   - **"Run Code" button** at the bottom of the editor
   - **Execution Results** section (appears after running code)

---

## 🔧 Troubleshooting

### Problem: "Cannot GET /" or blank page

**Solution:**
1. Make sure **BOTH** servers are running (check both terminals)
2. Frontend should be on port 5173
3. Backend should be on port 3001
4. Try refreshing the page (Ctrl+F5)

### Problem: Backend won't start

**Check:**
1. Is port 3001 already in use?
   ```powershell
   netstat -ano | findstr :3001
   ```
2. Does `backend/.env` file exist?
3. Check error messages in terminal

**Fix:**
- Kill process using port 3001, or
- Change `PORT=3002` in `backend/.env`

### Problem: Frontend won't start

**Check:**
1. Is port 5173 already in use?
2. Does `frontend/.env.local` file exist?
3. Are dependencies installed? (`npm install`)

**Fix:**
- Kill process using port 5173, or
- Change port in `frontend/vite.config.js`

### Problem: "Missing required environment variables"

**Solution:**
Make sure `backend/.env` has these variables (you can use placeholders):
```
NODE_ENV=development
PORT=3001
SUPABASE_URL=placeholder
SUPABASE_KEY=placeholder
MONGO_URL=mongodb://localhost:27017/devlab-dev
GEMINI_API_KEY=placeholder
x-rapidapi-key=your-key-here
x-rapidapi-host=judge0-ce.p.rapidapi.com
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
CORS_ORIGINS=http://localhost:5173
JWT_SECRET=dev-secret
SERVICE_API_KEY=dev-key
MICROSERVICE_API_KEYS=dev-key-1,dev-key-2
LOG_LEVEL=info
```

### Problem: CORS errors in browser console

**Solution:**
Make sure `backend/.env` has:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
```

---

## 📋 Quick Checklist

- [ ] Backend server running (Terminal 1 shows "Server running on port 3001")
- [ ] Frontend server running (Terminal 2 shows "Local: http://localhost:5173/")
- [ ] Browser opened to http://localhost:5173
- [ ] No errors in browser console (F12)
- [ ] No errors in terminal windows

---

## 🎯 Test the Code Execution

Once the website is open:

1. **Load a question** (or create test data)
2. **Write code** in the code editor
3. **Click "Run Code"** button
4. **See results** - The code will execute via Judge0 and show:
   - Output (stdout)
   - Errors (stderr)
   - Test case results (pass/fail)

---

## 💡 Need Help?

If you still can't access the website:

1. **Check both terminals** for error messages
2. **Verify environment files exist:**
   - `backend/.env`
   - `frontend/.env.local`
3. **Test backend directly:**
   - Open: http://localhost:3001/health
   - Should see JSON response
4. **Check browser console** (F12) for errors

---

**Ready to start! Follow the steps above.** 🚀

