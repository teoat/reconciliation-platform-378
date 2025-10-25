@echo off
echo 🚀 Reconciliation App Setup
echo ==========================

echo.
echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js first:
    echo 1. Download from: https://nodejs.org/
    echo 2. Run the installer
    echo 3. Restart your terminal
    pause
    exit /b 1
)

echo ✅ Node.js is installed
npm --version

echo.
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed

echo.
echo 🔨 Building application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    echo Check the error messages above
    pause
    exit /b 1
)

echo ✅ Application built successfully

echo.
echo 🚀 Starting development server...
echo The app will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
call npm run dev

