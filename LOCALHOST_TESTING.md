# Localhost Testing Guide - DEVLAB Microservice

## Quick Start

This guide will help you get the DEVLAB Microservice running on your local machine for testing.

---

## Prerequisites Check

Before starting, verify you have:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version

# Check if Git is installed
git --version
```

---

## Step 1: Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install
```

**Expected Output**: Should install all backend dependencies without errors.

### Frontend Dependencies

```bash
cd frontend
npm install
```

**Expected Output**: Should install all frontend dependencies without errors.

---

## Step 2: Environment Configuration

### Backend Environment Variables

Create `backend/.env` file:

```env
NODE_ENV=development
PORT=3001

# Database - Replace with your credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
MONGO_URL=mongodb://localhost:27017/devlab-dev

# External APIs - Replace with your keys
GEMINI_API_KEY=your-gemini-api-key
JUDGE0_API_KEY=your-judge0-api-key
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3001
JWT_SECRET=dev-jwt-secret-key
SERVICE_API_KEY=dev-service-api-key
MICROSERVICE_API_KEYS=dev-api-key-1,dev-api-key-2

# Logging
LOG_LEVEL=debug
```

### Frontend Environment Variables

Create `frontend/.env.local` file:

```env
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

---

## Step 3: Start Servers

### Terminal 1 - Backend Server

```bash
cd backend
npm run dev
```

**Expected Output**:
```
DEVLAB Backend Server running on port 3001
Connected to Supabase
Connected to MongoDB
```

**If you see errors**:
- Check database connection strings in `.env`
- Verify API keys are correct
- Check if port 3001 is available

### Terminal 2 - Frontend Server

```bash
cd frontend
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Step 4: Open in Browser

1. Open your browser
2. Navigate to: **http://localhost:5173**

**What you should see**:
- DEVLAB header with logo
- Navigation menu (Practice, Competition)
- Theme toggle button (day/night mode)
- Practice page (default view)

---

## Step 5: Test Basic Functionality

### Test 1: Health Check

Open new terminal or use browser:
```
http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 123,
  "environment": "development"
}
```

### Test 2: API Root

```
http://localhost:3001/
```

**Expected Response**:
```json
{
  "message": "DEVLAB Microservice API",
  "version": "1.0.0",
  "status": "running"
}
```

### Test 3: Frontend Navigation

- Click "Practice" - should navigate to practice page
- Click "Competition" - should navigate to competition page
- Click theme toggle - should switch between day/night mode

---

## Step 6: Test Features (Requires API Keys)

### Test Question Generation

**Requires**: Gemini API key

```bash
curl -X POST http://localhost:3001/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 1,
    "lesson_id": "lesson_test_123",
    "course_name": "Python Fundamentals",
    "lesson_name": "Variables",
    "nano_skills": ["variable_declaration"],
    "micro_skills": ["python_basics"],
    "question_type": "code",
    "programming_language": "Python"
  }'
```

### Test Code Execution

**Requires**: Judge0 API key

```bash
curl -X POST http://localhost:3001/api/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "code": "print(\"Hello World\")",
    "programming_language": "Python",
    "test_cases": [{
      "input": "",
      "expected_output": "Hello World"
    }],
    "question_id": "q_test_123"
  }'
```

---

## Troubleshooting

### Problem: Backend won't start

**Solutions**:
1. Check if port 3001 is in use: `netstat -ano | findstr :3001` (Windows)
2. Verify `.env` file exists in `backend/` directory
3. Check all required environment variables are set
4. Look at error messages for specific issues

### Problem: Frontend won't start

**Solutions**:
1. Check if port 5173 is in use
2. Verify `frontend/.env.local` exists
3. Clear Vite cache: Delete `frontend/node_modules/.vite`
4. Reinstall dependencies: `cd frontend && rm -rf node_modules && npm install`

### Problem: CORS errors

**Solutions**:
1. Check `CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173`
2. Restart backend server after changing CORS settings
3. Clear browser cache

### Problem: Database connection errors

**Solutions**:
1. Verify database URLs in `backend/.env`
2. Check database credentials
3. For MongoDB Atlas: Verify IP whitelist
4. For local MongoDB: Ensure MongoDB service is running

### Problem: API key errors

**Solutions**:
1. Verify API keys in `backend/.env`
2. Check API key validity
3. Verify API quotas not exceeded
4. Check API key permissions

---

## Testing Checklist

### Basic Functionality
- [ ] Frontend loads successfully
- [ ] Backend starts without errors
- [ ] Health check endpoint works
- [ ] Navigation works
- [ ] Theme toggle works

### API Endpoints
- [ ] Health check: `/health`
- [ ] API root: `/`
- [ ] Question generation: `/api/questions/generate` (requires API key)
- [ ] Code execution: `/api/code/execute` (requires API key)

### Features
- [ ] Practice page loads
- [ ] Competition page loads
- [ ] Error handling works
- [ ] Loading states work

---

## Next Steps

After successful localhost testing:

1. **Test all features** thoroughly
2. **Fix any issues** found
3. **Document issues** if any
4. **Approve for production** when ready
5. **Deploy to production** (after approval)

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages carefully
3. Check `backend/logs/` for backend errors
4. Check browser console for frontend errors
5. Verify all environment variables are set correctly

---

**Ready to test! Follow the steps above to get started.** 🚀





