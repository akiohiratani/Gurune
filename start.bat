@echo off
cd /d "%~dp0"

echo ========================================
echo Starting Vite Development Server...
echo ========================================

start "Vite Dev Server" cmd /k "npm run dev"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173/"

exit