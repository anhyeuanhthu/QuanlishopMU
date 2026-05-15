@echo off
echo ============================================
echo   SportShop - Khoi dong he thong
echo ============================================
echo.

:: Kiem tra Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Java! Vui long cai Java 21+
    pause
    exit /b 1
)

:: Kiem tra Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [LOI] Khong tim thay Node.js! Vui long cai Node.js
    pause
    exit /b 1
)

echo [1/2] Khoi dong Java QR Server (port 9000)...
cd /d "%~dp0qr-server"
start "Java QR Server" cmd /k "java -cp out QRServer"
timeout /t 2 /nobreak >nul

echo [2/2] Khoi dong Node.js Server (port 8888)...
cd /d "%~dp0"
start "Node.js App Server" cmd /k "node server.js"
timeout /t 2 /nobreak >nul

echo.
echo ============================================
echo   He thong da khoi dong!
echo   - QR Server  : http://localhost:9000
echo   - App Server : http://localhost:8888
echo   - Website    : http://localhost:8888
echo ============================================
echo.
start http://localhost:8888
pause
