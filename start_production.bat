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
echo [3/3] Launching Production Server...
echo Access the application at: http://localhost:8080
echo (Press Ctrl+C to stop)
echo.

python production.py
pause
