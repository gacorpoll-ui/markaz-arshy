@echo off
chcp 65001 >nul 2>nul
title Markaz Arshy - All Services
color 0A

echo.
echo ================================================
echo   MARKAZ ARSHY - Start ALL Services
echo ================================================
echo.

:: 1. Go to project directory
cd /d "D:\follower-store"
if errorlevel 1 (
    echo [ERROR] Folder D:\follower-store tidak ditemukan!
    goto :end
)

:: 2. Check Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js tidak ditemukan. Install dari https://nodejs.org
    goto :end
)
echo [OK] Node.js ditemukan.

:: 3. Check PM2
where pm2 >nul 2>&1
if errorlevel 1 (
    echo [ERROR] PM2 tidak ditemukan. Jalankan: npm install -g pm2
    goto :end
)
echo [OK] PM2 ditemukan.

:: 4. Check 9router (warning saja jika tidak ada)
if not exist "%APPDATA%\npm\node_modules\9router\app\custom-server.js" (
    echo [WARN] 9router tidak ditemukan - jalankan: npm install -g 9router
) else (
    echo [OK] 9router ditemukan.
)
echo.

:: 5. Stop old processes
:: PENTING: pm2 memanggil process.exit(1) yg terminate cmd jika tidak wrap dalam cmd /c
echo [1/4] Membersihkan proses lama...
cmd /c "pm2 delete all" >nul 2>&1
ping -n 3 127.0.0.1 >nul

:: Kill proses yang mungkin masih pakai port 5000, 5173, 20128 (orphan/stray processes)
echo       Membebaskan port yang digunakan...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":20128 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
ping -n 2 127.0.0.1 >nul
echo       Selesai.
echo.

:: 6. Install backend dependencies
echo [2/4] Menginstall backend dependencies...
cd /d "D:\follower-store\backend"
call npm install --omit=dev
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal install backend dependencies!
    goto :end
)
echo       Selesai.
echo.

:: 7. Build frontend
echo [3/4] Build frontend...
cd /d "D:\follower-store\frontend"
call npm install
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal install frontend dependencies!
    goto :end
)
call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal build frontend!
    goto :end
)
echo       Selesai.
echo.

:: 8. Start all services with PM2 ecosystem
echo [4/4] Memulai semua service via PM2...
cd /d "D:\follower-store"
cmd /c "pm2 start ecosystem.config.cjs"
if errorlevel 1 (
    echo.
    echo [ERROR] Gagal start PM2!
    echo         Coba manual: pm2 start ecosystem.config.cjs
    goto :end
)
cmd /c "pm2 save" >nul 2>&1
echo       Selesai.
echo.

:: 9. Wait for services to initialize
echo Menunggu services startup (10 detik)...
ping -n 11 127.0.0.1 >nul
echo.

:: 10. Verification
echo ================================================
echo   VERIFIKASI SERVICE
echo ================================================
echo.

echo Mengecek 9router Gateway (port 20128)...
curl -s --max-time 5 http://localhost:20128/v1/models >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] 9router - TIDAK merespons
) else (
    echo   [OK]   9router - OK
)

echo Mengecek Backend API (port 5000)...
curl -s --max-time 5 http://localhost:5000/api/health >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Backend API - TIDAK merespons
) else (
    echo   [OK]   Backend API - OK
)

echo Mengecek Frontend (port 5173)...
curl -s --max-time 5 http://localhost:5173 >nul 2>&1
if errorlevel 1 (
    echo   [FAIL] Frontend - TIDAK merespons
) else (
    echo   [OK]   Frontend - OK
)
echo.

:: 11. PM2 Status
echo ================================================
echo   PM2 STATUS
echo ================================================
echo.
cmd /c "pm2 list"
echo.

:: 12. Final Message
echo ================================================
echo   SELESAI!
echo   Website  : http://localhost:5173
echo   Backend  : http://localhost:5000
echo   AI Proxy : http://localhost:20128
echo   Jika FAIL: jalankan  pm2 logs
echo ================================================

:end
echo.
echo Tekan ENTER untuk menutup window ini...
pause >nul
