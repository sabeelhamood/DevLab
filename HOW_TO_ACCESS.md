# How to Access the DEVLAB Website

## 🌐 Website URL

**Yes, you need to visit:** http://localhost:5173

This is where the frontend (React) application runs.

---

## 📋 Step-by-Step Instructions

### Step 1: Start Backend Server (Terminal 1)

Open a terminal/command prompt and run:

```bash
cd C:\Users\ThinkPad\Desktop\DevLab\backend
npm run dev
```

**Wait for this message:**
```
DEVLAB Backend Server running on port 3001
```

**Keep this terminal open!** Don't close it.

### Step 2: Start Frontend Server (Terminal 2)

Open a **NEW** terminal/command prompt and run:

```bash
cd C:\Users\ThinkPad\Desktop\DevLab\frontend
npm run dev
```

**Wait for this message:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 3: Open Browser

1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Type in the address bar: **http://localhost:5173**
3. Press Enter

**You should see:**
- DEVLAB header/logo
- Navigation menu (Practice, Competition)
- Theme toggle button
- Practice page content

---

## 🔍 How to Check if Servers are Running

### Check Backend (Port 3001)

**Option 1: Browser**
- Open: http://localhost:3001
- You should see JSON response: `{"message":"DEVLAB Microservice API",...}`

**Option 2: Terminal**
```bash
curl http://localhost:3001
```

**Option 3: Health Check**
- Open: http://localhost:3001/health
- Should show: `{"status":"healthy",...}`

### Check Frontend (Port 5173)

**Browser:**
- Open: http://localhost:5173
- You should see the DEVLAB website interface

---

## ⚠️ Important Notes

1. **Both servers must be running** for the website to work properly
2. **Backend (3001)** provides the API
3. **Frontend (5173)** is what you see in the browser
4. **Keep both terminals open** while using the website
5. **If you close the terminals**, the servers stop and the website won't work

---

## 🐛 Troubleshooting

### "This site can't be reached" or "Connection refused"

**Problem**: Servers aren't running

**Solution**:
1. Make sure you started both servers (backend and frontend)
2. Check both terminal windows for errors
3. Verify you're using the correct URL: http://localhost:5173

### "ERR_CONNECTION_REFUSED"

**Problem**: Backend server not running

**Solution**:
1. Start backend server in Terminal 1
2. Wait for "Server running on port 3001" message
3. Refresh browser

### Blank page or errors in browser

**Problem**: Frontend server not running or has errors

**Solution**:
1. Check Terminal 2 (frontend) for error messages
2. Make sure `frontend/.env.local` exists
3. Try stopping and restarting the frontend server

---

## 📝 Quick Reference

| Component | Port | URL | Purpose |
|-----------|------|-----|---------|
| Frontend | 5173 | http://localhost:5173 | **Website UI (what you see)** |
| Backend | 3001 | http://localhost:3001 | API server (behind the scenes) |

---

## ✅ Summary

**To see the website:**
1. ✅ Start backend: `cd backend && npm run dev`
2. ✅ Start frontend: `cd frontend && npm run dev`
3. ✅ Open browser: **http://localhost:5173**

**That's it!** 🚀




