@echo off
echo Starting DEVLAB Microservice Development Environment...

echo.
echo Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo Starting Frontend Server (Port 3000)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Both servers are starting...
echo Frontend will be available at: http://localhost:3001
echo Backend will be available at: http://localhost:3001
echo.
echo Press any key to exit...
pause > nul




