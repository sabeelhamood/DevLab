# Setup Environment Files Script
# This script creates the necessary .env files for localhost testing

Write-Host "Setting up DEVLAB environment files..." -ForegroundColor Cyan

# Create backend/.env
$backendEnv = @"
NODE_ENV=development
PORT=3001

# Database Configuration (replace with your values)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
MONGO_URL=mongodb://localhost:27017/devlab-dev

# External APIs (replace with your keys - can use placeholders for now)
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
"@

$backendEnvPath = Join-Path $PSScriptRoot "backend\.env"
if (-not (Test-Path $backendEnvPath)) {
    $backendEnv | Out-File -FilePath $backendEnvPath -Encoding utf8
    Write-Host "✅ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend/.env already exists, skipping..." -ForegroundColor Yellow
}

# Create frontend/.env.local
$frontendEnv = @"
VITE_API_URL=http://localhost:3001
VITE_ENV=development
"@

$frontendEnvPath = Join-Path $PSScriptRoot "frontend\.env.local"
if (-not (Test-Path $frontendEnvPath)) {
    $frontendEnv | Out-File -FilePath $frontendEnvPath -Encoding utf8
    Write-Host "✅ Created frontend/.env.local" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend/.env.local already exists, skipping..." -ForegroundColor Yellow
}

Write-Host "`n✅ Environment files created!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env and replace placeholder values with your actual API keys" -ForegroundColor White
Write-Host "2. Start backend: cd backend && npm run dev" -ForegroundColor White
Write-Host "3. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host "4. Open browser: http://localhost:5173" -ForegroundColor White




