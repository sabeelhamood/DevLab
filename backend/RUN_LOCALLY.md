# Running Locally with Railway Environment Variables

Since all your API keys are stored in Railway Service Variables (not in `.env` files), you have two options to run locally:

## Option 1: Use Railway CLI (Recommended)

### Quick Start:
```powershell
npm run dev:railway
```

This will:
1. Check if Railway CLI is installed
2. Check if you're logged in (and prompt login if needed)
3. Link your project to Railway (if not already linked)
4. Run the dev server with all Railway environment variables loaded

### Manual Steps:
```powershell
# 1. Install Railway CLI (if not installed)
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Link your project (from backend directory)
railway link

# 4. Run with Railway env vars
railway run npm run dev
```

## Option 2: Run Without Railway CLI

If you want to run without Railway CLI, you'll need to create a temporary `.env` file:

```powershell
# Create backend/.env file with your Railway variables
GEMINI_API_KEY=your-key-from-railway
x-rapidapi-key=your-key-from-railway
x-rapidapi-host=judge0-ce.p.rapidapi.com
```

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed.

## Your Localhost URLs:

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Base:** http://localhost:3001/api

## Verify Railway Variables Are Loaded:

When you start the server, you should see:
```
Gemini API key loaded successfully
```

If you see this, Railway variables are working! 🎉

