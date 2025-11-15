# PowerShell script to install Node.js on Windows
Write-Host "🚀 Installing Node.js for 378 Data and Evidence Reconciliation App..." -ForegroundColor Green

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs administrator privileges to install Node.js" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host "Or manually download Node.js from: https://nodejs.org/" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit 1
}

# Download and install Node.js using winget (Windows Package Manager)
Write-Host "📦 Installing Node.js using Windows Package Manager..." -ForegroundColor Blue

try {
    # Try winget first (Windows 10/11)
    winget install OpenJS.NodeJS
    Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ winget not available. Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Download directly from nodejs.org
    $nodeUrl = "https://nodejs.org/dist/v20.10.0/node-v20.10.0-x64.msi"
    $installerPath = "$env:TEMP\nodejs-installer.msi"
    
    Write-Host "📥 Downloading Node.js installer..." -ForegroundColor Blue
    Invoke-WebRequest -Uri $nodeUrl -OutFile $installerPath
    
    Write-Host "🔧 Installing Node.js..." -ForegroundColor Blue
    Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $installerPath, "/quiet" -Wait
    
    # Clean up
    Remove-Item $installerPath -Force
    
    Write-Host "✅ Node.js installed successfully!" -ForegroundColor Green
}

# Refresh environment variables
Write-Host "🔄 Refreshing environment variables..." -ForegroundColor Blue
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Verify installation
Write-Host "🔍 Verifying Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
    Write-Host "🎉 Node.js is ready to use!" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js installation verification failed" -ForegroundColor Red
    Write-Host "You may need to restart your terminal or reboot your computer" -ForegroundColor Yellow
}

Write-Host "`n🚀 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your terminal" -ForegroundColor White
Write-Host "2. Run: npm install" -ForegroundColor White
Write-Host "3. Run: npm run build" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White

Read-Host "Press Enter to exit"
