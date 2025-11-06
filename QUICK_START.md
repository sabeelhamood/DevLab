# Quick Start - Fix Localhost Issues

## Issue Found: Dependencies and Environment Files Missing

### ✅ Step 1: Dependencies Status

**Backend**: ✅ Dependencies installed  
**Frontend**: Installing now...

### 📝 Step 2: Create Environment Files

You need to create 2 files manually (they're blocked by .gitignore):

#### File 1: `backend/.env`

Create this file in the `backend` folder with this content:

```env
NODE_ENV=development
PORT=3001

# Database Configuration (replace with your values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
MONGO_URL=mongodb://localhost:27017/devlab-dev

# External APIs (replace with your keys)
GEMINI_API_KEY=your-gemini-api-key
JUDGE0_API_KEY=your-judge0-api-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key-change-in-production
SERVICE_API_KEY=dev-service-api-key
MICROSERVICE_API_KEYS=dev-api-key-1,dev-api-key-2

# Logging
LOG_LEVEL=debug
```

**Note**: For now, you can use placeholder values if you don't have API keys yet. The app will still start, but some features won't work.

#### File 2: `frontend/.env.local`

Create this file in the `frontend` folder with this content:

```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### 🚀 Step 3: Start the Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### 🌐 Step 4: Open Browser

Visit: **http://localhost:5173**

---

## Troubleshooting

### If you see "Cannot find module" errors:

Make sure dependencies are installed:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### If backend won't start:

1. Check if port 3001 is available
2. Make sure `backend/.env` file exists
3. Check error messages in terminal

### If frontend won't start:

1. Check if port 5173 is available
2. Make sure `frontend/.env.local` file exists
3. Check error messages in terminal

### If you see CORS errors:

Make sure `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173`

---

## Quick Checklist

- [ ] Backend dependencies installed ✅
- [ ] Frontend dependencies installed (checking...)
- [ ] `backend/.env` file created
- [ ] `frontend/.env.local` file created
- [ ] Backend server started
- [ ] Frontend server started
- [ ] Browser opened to http://localhost:5173





