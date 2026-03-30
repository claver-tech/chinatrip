@echo off
echo.
echo  ===================================================
echo   China Trip Planner 2026 - Starting...
echo  ===================================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found. Please install Python 3.10+ from python.org
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found. Please install from nodejs.org
    pause
    exit /b 1
)

echo  [1/4] Installing Python backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt -q

echo  [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
npm install --silent

echo  [3/4] Starting backend (API + Database)...
cd /d "%~dp0backend"
start "China Trip - Backend" cmd /k "python -m uvicorn main:app --reload --port 8000"

echo  [4/4] Starting frontend...
cd /d "%~dp0frontend"
timeout /t 2 /nobreak >nul
start "China Trip - Frontend" cmd /k "npm run dev"

echo.
echo  ===================================================
echo   App is starting!
echo.
echo   Open your browser to: http://localhost:5173
echo.
echo   Backend API docs:     http://localhost:8000/docs
echo  ===================================================
echo.
timeout /t 4 /nobreak >nul
start http://localhost:5173
