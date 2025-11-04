# Local Development Setup Guide

## Quick Start

Follow these steps to run DEVLAB on localhost:

### Step 1: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Configure Environment Variables

**Backend** - Create `backend/.env` file:
```bash
NODE_ENV=development
PORT=3001

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key
MONGO_URL=mongodb://localhost:27017/devlab-dev
# OR MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/devlab-dev

# External APIs
GEMINI_API_KEY=your-gemini-api-key
JUDGE0_API_KEY=your-judge0-api-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# EduCore Microservices (use localhost or actual URLs)
COURSE_BUILDER_URL=http://localhost:3002
CONTENT_STUDIO_URL=http://localhost:3003
ASSESSMENT_URL=http://localhost:3004
LEARNING_ANALYTICS_URL=http://localhost:3005
RAG_URL=http://localhost:3006

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key-change-in-production
SERVICE_API_KEY=dev-service-api-key

# Logging
LOG_LEVEL=debug
```

**Frontend** - Create `frontend/.env.local` file:
```bash
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on: **http://localhost:3001**

You should see:
```
DEVLAB Backend Server running on port 3001
```

### Step 4: Start Frontend Server

Open a **new terminal window** and run:
```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 5: Open in Browser

Open your browser and go to:
**http://localhost:5173**

You should see the DEVLAB application!

---

## Troubleshooting

### Backend won't start

1. **Check if port 3001 is already in use:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Kill the process if needed, or change PORT in .env
   ```

2. **Check environment variables:**
   - Make sure `.env` file exists in `backend/` directory
   - Verify all required variables are set

3. **Check Node.js version:**
   ```bash
   node --version  # Should be 18 or higher
   ```

### Frontend won't start

1. **Check if port 5173 is already in use:**
   - Change port in `frontend/vite.config.js` if needed

2. **Check environment variables:**
   - Make sure `.env.local` file exists in `frontend/` directory
   - Verify `VITE_API_URL` points to backend URL

### API Connection Errors

1. **CORS Errors:**
   - Make sure backend `.env` has `CORS_ORIGINS` including `http://localhost:5173`
   - Restart backend server after changing CORS settings

2. **404 Errors:**
   - Verify backend is running on port 3001
   - Check `VITE_API_URL` in frontend `.env.local`

### Database Connection Errors

1. **Supabase:**
   - Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
   - Check Supabase project is active

2. **MongoDB:**
   - For local MongoDB: Make sure MongoDB is running
   - For MongoDB Atlas: Verify connection string and network access

---

## Testing the Setup

### Test Backend Health Check

Open browser or use curl:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  "environment": "development"
}
```

### Test Frontend

1. Open http://localhost:5173
2. You should see:
   - Header with DEVLAB logo
   - Navigation (Practice, Competition)
   - Theme toggle button
   - Practice page (default)

---

## Development Commands

### Backend
```bash
cd backend

npm run dev          # Start development server with hot reload
npm test             # Run tests
npm run lint         # Lint code
npm start            # Start production server
```

### Frontend
```bash
cd frontend

npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run preview      # Preview production build
```

---

## Next Steps

Once the project is running:

1. **Test API Endpoints:**
   - Use Postman or Thunder Client (VS Code extension)
   - Test health check: `GET http://localhost:3001/health`
   - Test question generation (requires Gemini API key)

2. **Test Frontend:**
   - Navigate between Practice and Competition pages
   - Test theme toggle (day/night mode)
   - Try loading questions (requires backend API)

3. **Continue Development:**
   - Add more features
   - Write more tests
   - Connect to real databases
   - Integrate with external APIs

---

## Notes

- **No GitHub Push**: As requested, no code has been pushed to GitHub
- **Local Development**: All code works in localhost environment
- **Database Setup**: You'll need to set up Supabase and MongoDB databases
- **API Keys**: You'll need Gemini and Judge0 API keys for full functionality

---

**Ready to run!** Follow the steps above to get started. 🚀



