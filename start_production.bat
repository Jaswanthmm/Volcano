@echo off
echo ===================================================
echo   VOLCANO THINKING ENGINE - PRODUCTION LAUNCHER
echo ===================================================
echo.
echo [1/3] Checking Environment...
cd backend
if not exist "venv" (
    echo Creating Python Virtual Environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing Production Dependencies...
pip install -r requirements.txt

echo.
echo [2/3] Verifying Frontend Build...
if not exist "..\frontend\dist" (
    echo WARNING: Frontend build not found!
    echo Please run 'npm run build' in frontend folder manually first.
    pause
    exit
)

echo.
echo [3/3] Launching Production Habitat...
echo.
echo ===================================================
echo Starting API Server (Port 8080)
start "Volcano API Core" cmd /k "label API & title Volcano API Core & ..\venv\Scripts\activate & python production.py"

echo Starting Thinking Engine (Worker)
start "Volcano Thinking Engine" cmd /k "label WORKER & title Volcano Thinking Engine & ..\venv\Scripts\activate & python worker.py"
echo ===================================================

echo.
echo Services Deployed! 
echo Dashboard: http://localhost:8080
echo.
pause
