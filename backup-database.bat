
@echo off
chcp 65001 > nul
echo ========================================
echo  Backup Database Sistem Surveilans PPI
echo  Rumah Sakit Budi Rahayu
echo ========================================
echo.

REM Jalankan skrip Node.js
node backup-database.js

echo.
pause
