@echo off
echo ============================================
echo   REBUILD MARKAZ-ARSHY
echo ============================================

cd /d D:\follower-store\frontend
echo [1/2] Building...
call npm run build
echo.

echo [2/2] Restarting server...
pm2 restart markaz-frontend
echo.

echo DONE! Refresh browser.
pause
