@echo off
chcp 65001 >nul 2>nul
title Fix Port 5000 & Start Backend
color 0C

echo.
echo ================================================
echo  Fix Port 5000 & Start Backend
echo ================================================
echo.

set "port=5000"
set "pid="

echo Looking for process on port %port%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%port%" ^| findstr "LISTENING"') do (
    if not defined pid (
        set "pid=%%a"
        echo Found process with PID %%a on port %port%.
    )
)

if defined pid (
    echo Stopping process %pid%...
    taskkill /F /PID %pid% >nul
    if errorlevel 1 (
        echo   [WARN] Could not stop process %pid%. It might require admin rights.
    ) else (
        echo   [SUCCESS] Process %pid% stopped.
    )
    timeout /t 2 /nobreak >nul
) else (
    echo No process found on port %port%.
)

echo.
echo ================================================
echo  Starting Backend Server...
echo ================================================
echo.

cd /d D:\follower-store\backend
call npm start

echo.
pause
