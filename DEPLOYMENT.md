# Deployment Configuration

## Production URLs

- **Frontend (Vercel):** https://dev-lab-mocha.vercel.app/
- **Backend (Railway):** https://devlab-backend-production-0bcb.up.railway.app

## Vercel Environment Variables

Add these environment variables in your Vercel project settings:

```
VITE_API_URL=https://devlab-backend-production-0bcb.up.railway.app
```

**⚠️ IMPORTANT:** The `VITE_API_URL` should NOT include `/api` at the end. It should be just the base URL.

- ✅ Correct: `https://devlab-backend-production-0bcb.up.railway.app`
- ❌ Wrong: `https://devlab-backend-production-0bcb.up.railway.app/api`

The frontend services already add `/api/` to their paths, so including it in `VITE_API_URL` would cause double `/api` paths.

### How to Set in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update the variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://devlab-backend-production-0bcb.up.railway.app` (without `/api`)
   - **Environment:** Production, Preview, Development (all)
4. Save and redeploy

## Railway Backend Configuration

The backend is deployed on Railway and automatically:
- Uses Railway Service Variables for all API keys (GEMINI_API_KEY, x-rapidapi-key, etc.)
- Exposes the backend at: `https://devlab-backend-production-0bcb.up.railway.app`
- CORS is configured to allow requests from:
  - `https://dev-lab-phi.vercel.app` (Vercel frontend)
  - `http://localhost:5173` (local development)

## Local Development

### Backend:
```powershell
cd backend
npm run dev:railway  # Uses Railway env vars
# OR
npm run dev  # Uses local .env file (if exists)
```

Backend runs on: `http://localhost:3001`

### Frontend:
```powershell
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

The frontend will automatically use:
- Local backend (`http://localhost:3001`) in development
- Railway backend (`https://devlab-backend-production-0bcb.up.railway.app`) in production (if VITE_API_URL is not set)

## Testing Production Setup

1. **Frontend:** Visit https://dev-lab-phi.vercel.app/
2. **Backend API:** Test with `https://devlab-backend-production-0bcb.up.railway.app/health`

## CORS Configuration

The backend CORS allows requests from:
- ✅ `https://dev-lab-phi.vercel.app` (Production frontend)
- ✅ `http://localhost:5173` (Local development)
- ✅ All `.vercel.app` subdomains (for preview deployments)
- ✅ `https://devlab-backend-production-0bcb.up.railway.app` (Backend direct access)

To add more origins, set `CORS_ORIGINS` in Railway Service Variables (comma-separated).

---

## Live Service Integrations

The deployed backend on Railway connects to the following external services using secure environment variables:

### 1. Google Gemini API

**Purpose:** AI-powered question generation, feedback, hints, and fraud detection

**Railway Service Variables:**
- `GEMINI_API_KEY` - Your Google Gemini API key

**How it's used:**
```javascript
// backend/src/config/environment.js
gemini: {
  apiKey: process.env.GEMINI_API_KEY
}

// backend/src/clients/geminiClient.js
this.apiKey = config.externalApis.gemini.apiKey;
```

**API Endpoint:** `https://generativelanguage.googleapis.com/v1beta`

**Update/Rotate:**
1. Go to Railway Dashboard → Your Service → Variables
2. Update `GEMINI_API_KEY` with new key
3. Railway automatically redeploys with new value

---

### 2. Judge0 via RapidAPI (Free Plan)

**Purpose:** Secure code execution sandbox for running learner code submissions

**Railway Service Variables:**
- `X_RAPIDAPI_KEY` - Your RapidAPI subscription key
- `X_RAPIDAPI_HOST` - RapidAPI host (defaults to `judge0-ce.p.rapidapi.com`)

**How it's used:**
```javascript
// backend/src/config/environment.js
judge0: {
  apiKey: process.env.X_RAPIDAPI_KEY || process.env['x-rapidapi-key'],
  apiHost: process.env.X_RAPIDAPI_HOST || process.env['x-rapidapi-host'] || 'judge0-ce.p.rapidapi.com',
  apiUrl: 'https://judge0-ce.p.rapidapi.com'
}

// backend/src/clients/judge0Client.js
headers: {
  'X-RapidAPI-Key': this.apiKey,
  'X-RapidAPI-Host': this.apiHost
}
```

**API Endpoint:** `https://judge0-ce.p.rapidapi.com`

**Update/Rotate:**
1. Go to Railway Dashboard → Your Service → Variables
2. Update `X_RAPIDAPI_KEY` with new RapidAPI key
3. If host changes, update `X_RAPIDAPI_HOST`
4. Railway automatically redeploys

**Note:** The code supports both `X_RAPIDAPI_KEY` (Railway format) and `x-rapidapi-key` (lowercase with hyphens) for backward compatibility.

---

### 3. Supabase (PostgreSQL Database)

**Purpose:** Storing questions, user data, and application state

**Railway Service Variables:**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/service role key

**How it's used:**
```javascript
// backend/src/config/environment.js
database: {
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  }
}

// backend/src/database/supabase.js
const supabase = createClient(
  config.database.supabase.url,
  config.database.supabase.key
);
```

**Update/Rotate:**
1. Go to Railway Dashboard → Your Service → Variables
2. Update `SUPABASE_URL` if project URL changes
3. Update `SUPABASE_KEY` with new service role key (for security rotation)
4. Railway automatically redeploys

**Security Note:** Use the service role key only for backend operations. Never expose it in frontend code.

---

### 4. MongoDB Atlas

**Purpose:** Logging API requests, errors, and analytics data

**Railway Service Variables:**
- `MONGO_URL` - MongoDB Atlas connection string

**How it's used:**
```javascript
// backend/src/config/environment.js
database: {
  mongodb: {
    url: process.env.MONGO_URL
  }
}

// backend/src/database/mongodb.js
client = new MongoClient(config.database.mongodb.url);
```

**Connection String Format:** `mongodb+srv://username:password@cluster.mongodb.net/database`

**Update/Rotate:**
1. Go to Railway Dashboard → Your Service → Variables
2. Update `MONGO_URL` with new connection string
3. Railway automatically redeploys

**Security Note:** The connection string includes credentials. Keep it secure and rotate regularly.

---

## Environment Variable Management

### Viewing Current Variables

**In Railway:**
1. Go to Railway Dashboard
2. Select your service
3. Go to **Variables** tab
4. All variables are listed here (values are masked for security)

### Adding New Variables

1. Go to Railway Dashboard → Your Service → Variables
2. Click **+ New Variable**
3. Enter variable name and value
4. Select environment (Production/Preview/Development)
5. Click **Add**
6. Railway automatically redeploys

### Updating/Rotating Variables

**For Security Rotation (API Keys, Passwords):**
1. Generate new key/credential from service provider
2. Update variable in Railway (old value is immediately replaced)
3. Railway redeploys automatically
4. Old key remains valid until service provider invalidates it (coordinate timing)

**For Configuration Changes:**
1. Update variable value in Railway
2. Railway redeploys automatically
3. No downtime (zero-downtime deployments)

### Removing Variables

1. Go to Railway Dashboard → Your Service → Variables
2. Click the trash icon next to the variable
3. Confirm deletion
4. Railway redeploys (application will use fallback defaults if configured)

---

## Service Health Checks

### Test Gemini API Connection

```bash
curl https://devlab-backend-production.up.railway.app/api/questions/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"quantity":1,"lesson_id":"test","course_name":"Test","lesson_name":"Test","nano_skills":["test"],"micro_skills":["test"],"question_type":"code","programming_language":"python"}'
```

### Test Judge0 Connection

```bash
curl https://devlab-backend-production.up.railway.app/api/code/execute \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"Hello World\")","language":"python"}'
```

### Test Database Connections

```bash
# Health check endpoint
curl https://devlab-backend-production.up.railway.app/api/health
```

---

## Troubleshooting

### Service Not Connecting

1. **Check Variable Names:** Ensure exact match (case-sensitive)
   - ✅ `GEMINI_API_KEY` (correct)
   - ❌ `gemini_api_key` (wrong)
   - ❌ `GEMINI-API-KEY` (wrong)

2. **Check Variable Values:** Verify no extra spaces or quotes
   - ✅ `AIzaSyB...` (correct)
   - ❌ `"AIzaSyB..."` (has quotes)
   - ❌ ` AIzaSyB...` (has leading space)

3. **Check Railway Logs:**
   - Go to Railway Dashboard → Your Service → Deployments
   - Click on latest deployment → View Logs
   - Look for environment variable loading messages

### API Key Invalid Errors

1. Verify key is active in service provider dashboard
2. Check API key restrictions (IP whitelist, domain restrictions)
3. Verify key hasn't expired
4. Check rate limits haven't been exceeded

### Database Connection Failures

1. Verify connection string format is correct
2. Check MongoDB Atlas/Supabase firewall allows Railway IPs
3. Verify credentials are correct
4. Check database service is running

---

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys regularly** - Set calendar reminders for quarterly rotation
3. **Use least privilege** - Only grant necessary permissions to API keys
4. **Monitor usage** - Check service provider dashboards for unusual activity
5. **Use separate keys for dev/prod** - Railway supports environment-specific variables
6. **Log access** - Monitor Railway logs for authentication failures

---

## Future Developer Guide

### Adding a New External Service

1. **Add Variable to Railway:**
   - Go to Railway Dashboard → Variables
   - Add new variable (e.g., `NEW_SERVICE_API_KEY`)

2. **Update `backend/src/config/environment.js`:**
   ```javascript
   externalApis: {
     newService: {
       apiKey: process.env.NEW_SERVICE_API_KEY
     }
   }
   ```

3. **Update Client Code:**
   - Create `backend/src/clients/newServiceClient.js`
   - Use `config.externalApis.newService.apiKey`

4. **Update This Documentation:**
   - Add service to "Live Service Integrations" section
   - Document variable name, purpose, and update instructions

5. **Test Locally:**
   - Use Railway CLI: `railway run npm run dev`
   - Or create temporary `.env.local` for testing

### Modifying Existing Service Configuration

1. Update variable in Railway
2. Update code if variable name changes
3. Update this documentation
4. Test in staging before production
5. Commit and push changes

---

## Support

For issues with:
- **Railway:** Check [Railway Documentation](https://docs.railway.app)
- **Gemini API:** Check [Google AI Studio](https://makersuite.google.com)
- **Judge0/RapidAPI:** Check [RapidAPI Judge0 Docs](https://rapidapi.com/judge0-official/api/judge0-ce)
- **Supabase:** Check [Supabase Docs](https://supabase.com/docs)
- **MongoDB:** Check [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

