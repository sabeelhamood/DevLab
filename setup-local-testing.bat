@echo off
REM Local Development Setup Script for Competition Feature Testing
REM This script helps you test the complete 2-player anonymous competition feature locally

echo 🚀 Setting up local development environment for competition feature testing...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo 📋 Setting up environment files...

REM Create backend .env.local if it doesn't exist
if not exist "backend\.env.local" (
    echo 📝 Creating backend\.env.local from example...
    copy "backend\env.local.example" "backend\.env.local"
    echo ✅ Backend environment file created. Please update the values in backend\.env.local
) else (
    echo ✅ Backend environment file already exists
)

REM Create frontend .env.local if it doesn't exist
if not exist "frontend\.env.local" (
    echo 📝 Creating frontend\.env.local from example...
    copy "frontend\env.local.example" "frontend\.env.local"
    echo ✅ Frontend environment file created
) else (
    echo ✅ Frontend environment file already exists
)

echo.
echo 🔧 Installation steps:
echo 1. Install backend dependencies:
echo    cd backend ^&^& npm install
echo.
echo 2. Install frontend dependencies:
echo    cd frontend ^&^& npm install
echo.
echo 3. Update environment variables:
echo    - Edit backend\.env.local with your API keys
echo    - Frontend\.env.local is already configured for local testing
echo.
echo 4. Start the backend:
echo    cd backend ^&^& npm run dev
echo.
echo 5. Start the frontend (in a new terminal):
echo    cd frontend ^&^& npm run dev
echo.
echo 🎯 Testing the competition feature:
echo 1. Open http://localhost:5173 in your browser
echo 2. Navigate to /competition/invitation
echo 3. Test the complete flow: invitation → competition → results
echo.
echo 📝 Notes:
echo - Backend runs on http://localhost:3001
echo - Frontend runs on http://localhost:5173
echo - Competition routes are active: /api/competitions/*
echo - Mock data is used when API keys are not available
echo - All existing functionality is preserved
echo.
echo ✅ Setup complete! Follow the steps above to start testing.
pause
