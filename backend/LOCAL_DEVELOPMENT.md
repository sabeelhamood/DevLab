# Local Development Setup

This project uses Railway Service Variables for all API keys and secrets. No `.env` file is needed in the repository.

## Option 1: Use Railway CLI (Recommended)

The Railway CLI allows you to run your local development server with all Railway Service Variables automatically loaded.

### Setup Steps:

1. **Install Railway CLI:**
   ```powershell
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```powershell
   railway login
   ```

3. **Link your project:**
   ```powershell
   cd backend
   railway link
   ```
   Select your project when prompted.

4. **Run the development server with Railway env vars:**
   ```powershell
   railway run npm run dev
   ```

All your Railway Service Variables (like `GEMINI_API_KEY`, `x-rapidapi-key`, etc.) will be automatically available to your local server!

## Option 2: Temporary .env file (Not Recommended)

If you need to run locally without Railway CLI, you can create a temporary `.env` file:

1. **Create `backend/.env` file:**
   ```
   GEMINI_API_KEY=your-actual-key-from-railway
   x-rapidapi-key=your-actual-key-from-railway
   x-rapidapi-host=judge0-ce.p.rapidapi.com
   ```

2. **Get the values from Railway:**
   - Go to your Railway project
   - Open Service Variables
   - Copy the values you need

3. **Important:** The `.env` file is already in `.gitignore`, so it won't be committed to the repository.

## Environment Variables in Railway

All these variables are stored in Railway Service Variables:

- `GEMINI_API_KEY` - Google Gemini API key
- `x-rapidapi-key` - RapidAPI key for Judge0
- `x-rapidapi-host` - RapidAPI host for Judge0
- `SUPABASE_URL` - Supabase database URL
- `SUPABASE_KEY` - Supabase API key
- `MONGO_URL` - MongoDB connection string

## Production

In Railway, all environment variables are automatically loaded from Service Variables. No configuration needed!

