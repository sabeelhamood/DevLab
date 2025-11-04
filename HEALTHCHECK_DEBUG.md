# Healthcheck Debug Explanation

## What I Changed (Summary)

### 1. **Moved `/health` route BEFORE security middleware**
   - **Location**: `backend/src/app.js` line 26
   - **Why**: So Railway healthchecks don't get blocked by Helmet/CORS
   - **Current**: `app.use('/health', healthRoutes);` is now BEFORE `app.use(helmet());`

### 2. **Updated CORS to allow Railway healthcheck hostname**
   - **Location**: `backend/src/app.js` lines 32-58
   - **Why**: Railway sends requests from `healthcheck.railway.app`
   - **Current**: Added `healthcheck.railway.app` to allowed origins

### 3. **Made environment validation non-blocking in production**
   - **Location**: `backend/src/config/environment.js` lines 67-70
   - **Why**: Server must start even if API keys are missing
   - **Current**: In production, validation warns but doesn't throw

### 4. **Server listens on 0.0.0.0**
   - **Location**: `backend/server.js` line 13
   - **Why**: Railway needs to reach the server from outside container
   - **Current**: `app.listen(PORT, '0.0.0.0', ...)`

## Potential Issues Still Remaining

### Issue #1: Helmet might still block healthchecks
Even though `/health` is registered first, Helmet applies globally to all routes. We might need to configure Helmet to allow healthchecks.

### Issue #2: Config import might fail
If `validateEnv()` throws an error during import, the entire `config` object won't be exported, causing `app.js` to fail on import.

### Issue #3: Health route path might be wrong
The route is `router.get('/')` inside `healthRoutes`, which should work with `app.use('/health', healthRoutes)`, but let's verify.

### Issue #4: Server might not be starting at all
If there's any error during startup, the server won't start, and healthchecks will fail.

## Next Steps to Debug

1. **Check Railway logs** - Look for server startup messages
2. **Test health endpoint directly** - Make sure it returns 200
3. **Configure Helmet properly** - Allow healthcheck requests
4. **Simplify health endpoint** - Remove async/dependencies that could fail

