@echo off
chcp 65001 >nul 2>nul
title Markaz Arshy - Service Test
color 0B

echo.
echo  ================================================
echo   MARKAZ ARSHY - SERVICE TEST
echo  ================================================
echo.

set "passed=0"
set "failed=0"

:: Test 1: 9router Gateway
echo [1/5] Testing 9router Gateway...
curl -s http://localhost:20128/v1/models >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] 9router not responding
    set /a failed+=1
) else (
    echo   [PASS] 9router responding
    set /a passed+=1
)

:: Test 2: Backend API Health
echo [2/5] Testing Backend API Health...
curl -s http://localhost:5000/api/health | findstr /C:"status" >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Backend health check failed
    set /a failed+=1
) else (
    echo   [PASS] Backend API healthy
    set /a passed+=1
)

:: Test 3: Frontend
echo [3/5] Testing Frontend...
curl -s http://localhost:5173 | findstr /C:"Markaz" >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Frontend not serving
    set /a failed+=1
) else (
    echo   [PASS] Frontend serving
    set /a passed+=1
)

:: Test 4: Production Site
echo [4/5] Testing Production Site (markaz-arshy.com)...
curl -sI https://markaz-arshy.com >nul 2>&1
if errorlevel 1 (
    echo   [WARN] Production site not reachable
) else (
    echo   [PASS] Production site reachable
    set /a passed+=1
)

:: Test 5: PM2 Process Stability
echo [5/5] Testing PM2 Process Stability...
pm2 list | findstr /C:"9router-gateway" | findstr /C:"online" >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] 9router-gateway not online
    set /a failed+=1
) else (
    pm2 list | findstr /C:"markaz-backend" | findstr /C:"online" >nul 2>&1
    if errorlevel 1 (
        echo   [FAIL] markaz-backend not online
        set /a failed+=1
    ) else (
        pm2 list | findstr /C:"markaz-frontend" | findstr /C:"online" >nul 2>&1
        if errorlevel 1 (
            echo   [FAIL] markaz-frontend not online
            set /a failed+=1
        ) else (
            echo   [PASS] All PM2 processes online
            set /a passed+=1
        )
    )
)

echo.
echo  ================================================
echo   TEST RESULTS
echo  ================================================
echo.
echo   Passed: %passed%
echo   Failed: %failed%
echo.

if "%failed%"=="0" (
    echo  ================================================
    echo   ALL TESTS PASSED!
    echo  ================================================
) else (
    echo  ================================================
    echo   SOME TESTS FAILED
    echo  ================================================
)

echo.
pause
