# Run development server with Railway environment variables
# This script automatically loads all Railway Service Variables for local development

Write-Host "🚂 Starting DEVLAB Backend with Railway environment variables..." -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI is not installed." -ForegroundColor Red
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$railwayStatus = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not logged in to Railway. Opening login..." -ForegroundColor Yellow
    Write-Host "Please complete the login in your browser, then run this script again." -ForegroundColor Yellow
    railway login
    exit 0
}

# Check if project is linked
if (-not (Test-Path .railway)) {
    Write-Host "🔗 Linking project to Railway..." -ForegroundColor Yellow
    railway link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to link project. Please run 'railway link' manually." -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Running development server with Railway environment variables..." -ForegroundColor Green
Write-Host "📝 All Railway Service Variables (GEMINI_API_KEY, x-rapidapi-key, etc.) are automatically loaded" -ForegroundColor Cyan
Write-Host ""

# Run the dev server with Railway env vars
railway run npm run dev

