@echo off
chcp 65001 >nul 2>nul
title Force-Stop Port 5000 & Start Backend
color 0C

echo.
echo ================================================
echo  Force-Stop Port 5000 & Start Backend
echo ================================================
echo.

set "port=5000"
set "max_attempts=5"
set "attempt=0"

:check_port
set "pid="
echo Attempt %attempt% to check port %port%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%port%" ^| findstr "LISTENING"') do (
    if not defined pid (
        set "pid=%%a"
    )
)

if defined pid (
    echo Found process with PID %pid% on port %port%.
    echo Stopping process %pid%...
    taskkill /F /PID %pid% >nul
    if errorlevel 1 (
        echo   [WARN] Failed to stop process %pid%. It might require admin rights.
    ) else (
        echo   [SUCCESS] Process %pid% stopped.
    )

    set /a attempt+=1
    if %attempt% lss %max_attempts% (
        echo Waiting 2 seconds before re-checking...
        timeout /t 2 /nobreak >nul
        goto :check_port
    ) else (
        echo [ERROR] Could not free port %port% after %max_attempts% attempts.
        goto :end
    )
)

echo Port %port% is now free.
echo.
echo ================================================
echo  Installing dependencies (if needed)...
echo ================================================
echo.

cd /d D:\follower-store\backend
call npm install 2>nul
echo Done.

echo.
echo ================================================
echo  Starting Backend Server (npm run dev)
echo ================================================
echo.

call npm run dev

:end
echo.
echo Press any key to close this window...
pause >nul
