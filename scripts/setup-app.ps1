# Complete Reconciliation App Setup Script
Write-Host "🚀 Reconciliation App Setup Script" -ForegroundColor Green
Write-Host "=" * 40 -ForegroundColor Blue

# Check if Node.js is installed
Write-Host "`n🔍 Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js first:" -ForegroundColor Yellow
    Write-Host "1. Run: .\install-nodejs-guide.ps1" -ForegroundColor Cyan
    Write-Host "2. Or download from: https://nodejs.org/" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 1: Install dependencies
Write-Host "`n📦 Installing project dependencies..." -ForegroundColor Blue
try {
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Build the application
Write-Host "`n🔨 Building the application..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Application built successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "`n🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if all TypeScript errors are fixed" -ForegroundColor White
    Write-Host "2. Ensure all dependencies are installed" -ForegroundColor White
    Write-Host "3. Try running: npm run build 2>&1 | Out-String" -ForegroundColor White
    Read-Host "Press Enter to continue"
}

# Step 3: Start development server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Blue
Write-Host "The app will be available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

try {
    npm run dev
} catch {
    Write-Host "❌ Failed to start development server" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

