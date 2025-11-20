# Simple Node.js installation guide
Write-Host "🚀 Node.js Installation Guide for Reconciliation App" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Blue

Write-Host "`n📋 Manual Installation Steps:" -ForegroundColor Cyan
Write-Host "1. Go to https://nodejs.org/" -ForegroundColor White
Write-Host "2. Download the LTS version (recommended)" -ForegroundColor White
Write-Host "3. Run the installer (.msi file)" -ForegroundColor White
Write-Host "4. Follow the installation wizard" -ForegroundColor White
Write-Host "5. Restart your terminal/PowerShell" -ForegroundColor White

Write-Host "`n🔍 After installation, verify with:" -ForegroundColor Cyan
Write-Host "node --version" -ForegroundColor Yellow
Write-Host "npm --version" -ForegroundColor Yellow

Write-Host "`n🚀 Once Node.js is installed, run these commands:" -ForegroundColor Cyan
Write-Host "npm install" -ForegroundColor Yellow
Write-Host "npm run build" -ForegroundColor Yellow
Write-Host "npm run dev" -ForegroundColor Yellow

Write-Host "`n💡 Alternative: Use Chocolatey (if installed)" -ForegroundColor Cyan
Write-Host "choco install nodejs" -ForegroundColor Yellow

Write-Host "`n💡 Alternative: Use Scoop (if installed)" -ForegroundColor Cyan
Write-Host "scoop install nodejs" -ForegroundColor Yellow

Write-Host "`n🌐 Opening Node.js download page..." -ForegroundColor Blue
Start-Process "https://nodejs.org/"

Read-Host "Press Enter to exit"
