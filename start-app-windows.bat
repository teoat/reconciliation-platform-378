@echo off
title 378 Data and Evidence Reconciliation App Launcher
color 0A

echo.
echo ========================================
echo    378 Data and Evidence Reconciliation App
echo ========================================
echo.

REM Try to find Node.js and npm
set NODE_FOUND=0
set NPM_FOUND=0

REM Check common Node.js installation paths
for %%i in (
    "%ProgramFiles%\nodejs\node.exe"
    "%ProgramFiles(x86)%\nodejs\node.exe"
    "%APPDATA%\npm\node.exe"
    "%USERPROFILE%\AppData\Roaming\npm\node.exe"
) do (
    if exist "%%i" (
        set NODE_FOUND=1
        set NODE_PATH=%%i
        goto :found_node
    )
)

:found_node
if %NODE_FOUND%==0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found at: %NODE_PATH%

REM Check for npm
for %%i in (
    "%ProgramFiles%\nodejs\npm.cmd"
    "%ProgramFiles(x86)%\nodejs\npm.cmd"
    "%APPDATA%\npm\npm.cmd"
    "%USERPROFILE%\AppData\Roaming\npm\npm.cmd"
) do (
    if exist "%%i" (
        set NPM_FOUND=1
        set NPM_PATH=%%i
        goto :found_npm
    )
)

:found_npm
if %NPM_FOUND%==0 (
    echo [ERROR] npm not found!
    echo Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] npm found at: %NPM_PATH%

REM Add npm to PATH temporarily
set PATH=%NPM_PATH%;%PATH%

REM Check versions
echo.
echo Checking versions...
"%NODE_PATH%" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not working properly
    pause
    exit /b 1
)

"%NPM_PATH%" --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not working properly
    pause
    exit /b 1
)

echo [OK] Node.js and npm are working!

REM Install dependencies if needed
if not exist "node_modules" (
    echo.
    echo Installing dependencies...
    "%NPM_PATH%" install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully!
) else (
    echo [OK] Dependencies already installed
)

REM Open launcher page
echo.
echo Opening launcher page...
start "" "launcher.html"

REM Start the development server
echo.
echo Starting 378 Data and Evidence Reconciliation App on http://localhost:1000...
echo Press Ctrl+C to stop the server
echo.
"%NPM_PATH%" run dev

pause
