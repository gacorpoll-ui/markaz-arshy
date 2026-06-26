@echo off
chcp 65001 >nul 2>nul
title Markaz Arshy - Quick Start
color 0B

echo.
echo ================================================
echo  MARKAZ ARSHY - QUICK START
echo ================================================
echo.
echo  Starting services without rebuild...
echo.

:: Change to project directory
cd /d D:\follower-store
if errorlevel 1 (
    echo [ERROR] Cannot find D:\follower-store
    goto :end
)

:: Check PM2
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PM2 not found. Install: npm install -g pm2
    goto :end
)

:: Kill old PM2
echo Cleaning old processes...
pm2 kill 2>nul
timeout /t 2 /nobreak

:: Start all services
echo Starting services...
pm2 start ecosystem.config.cjs
if errorlevel 1 (
    echo.
    echo [ERROR] Failed to start services!
    goto :end
)

:: Save PM2 config
pm2 save 2>nul

:: Wait for startup
echo.
echo Waiting for services (8 seconds)...
timeout /t 8 /nobreak

:: Quick verify
echo.
echo Checking services...
echo.

set "ok=0"

curl -s http://localhost:20128/v1/models >nul 2>&1
if errorlevel 1 (
    echo  [FAIL] 9router (port 20128)
) else (
    echo  [OK]   9router (port 20128)
    set /a ok+=1
)

curl -s http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo  [FAIL] Backend (port 5000)
) else (
    echo  [OK]   Backend (port 5000)
    set /a ok+=1
)

curl -s http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo  [FAIL] Frontend (port 5173)
) else (
    echo  [OK]   Frontend (port 5173)
    set /a ok+=1
)

echo.
pm2 list

echo.
if "%ok%"=="3" (
    echo ================================================
    echo  ALL 3 SERVICES RUNNING!
    echo ================================================
) else (
    echo ================================================
    echo  SOME SERVICES FAILED
    echo ================================================
)

:end
echo.
echo Press any key to close...
pause >nul
