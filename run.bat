@echo off
title UNO Realtime Game Launcher
color 0A

echo ================================================================
echo           UNO REALTIME MULTIPLAYER - STEAM EDITION
echo ================================================================
echo.

:: Dam bao Node.js va npm co trong PATH
set "PATH=C:\Program Files\nodejs;%PATH%"

:: Tim thu muc du an UNO
set "PROJECT_DIR="

if exist "%~dp0package.json" (
    set "PROJECT_DIR=%~dp0"
) else if exist "C:\Users\ACER\OneDrive\TILIU~1\GitHub\3TLPJ\package.json" (
    set "PROJECT_DIR=C:\Users\ACER\OneDrive\TILIU~1\GitHub\3TLPJ"
) else if exist "C:\Users\ACER\OneDrive\Tài liệu\GitHub\3TLPJ\package.json" (
    set "PROJECT_DIR=C:\Users\ACER\OneDrive\Tài liệu\GitHub\3TLPJ"
) else if exist "E:\3TLPJ\package.json" (
    set "PROJECT_DIR=E:\3TLPJ"
) else if exist "E:\GitHub\3TLPJ\package.json" (
    set "PROJECT_DIR=E:\GitHub\3TLPJ"
)

if "%PROJECT_DIR%"=="" (
    color 0C
    echo [LOI] Khong tim thay thu muc du an UNO!
    echo Vui long kiem tra lai duong dan:
    echo  - C:\Users\ACER\OneDrive\Tai lieu\GitHub\3TLPJ
    echo  - E:\3TLPJ
    echo.
    pause
    exit /b 1
)

echo [*] Thu muc du an: %PROJECT_DIR%
cd /d "%PROJECT_DIR%"

echo.
echo [*] Kiem tra Node.js...
node -v >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [LOI] Chua cai dat Node.js hoac khong tim thay trong PATH!
    pause
    exit /b 1
)

echo [*] Tu dong mo trinh duyet sau 3 giay...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

echo [*] Dang khoi dong Server (Port 3001) va Client (Port 5173)...
echo [*] Nhan Ctrl + C de dung game bat ky luc nao.
echo ================================================================
echo.

npm run dev

pause
