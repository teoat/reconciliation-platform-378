# PowerShell script to fix npm PATH and start the app
# This script adds npm to the PATH and starts the Reconciliation app

Write-Host "🔧 Fixing npm PATH and starting Reconciliation App..." -ForegroundColor Green

# Add common npm paths to PATH
$npmPaths = @(
    "$env:APPDATA\npm",
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:USERPROFILE\AppData\Roaming\npm"
)

foreach ($path in $npmPaths) {
    if (Test-Path $path) {
        if ($env:PATH -notlike "*$path*") {
            $env:PATH = "$path;$env:PATH"
            Write-Host "✅ Added to PATH: $path" -ForegroundColor Blue
        }
    }
}

# Try to find npm in the system
$npmPath = $null
try {
    $npmPath = Get-Command npm -ErrorAction Stop | Select-Object -ExpandProperty Source
    Write-Host "✅ Found npm at: $npmPath" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found in PATH. Trying alternative methods..." -ForegroundColor Yellow
    
    # Try using npx or node directly
    try {
        $nodePath = Get-Command node -ErrorAction Stop | Select-Object -ExpandProperty Source
        $npmPath = Join-Path (Split-Path $nodePath) "npm.cmd"
        
        if (Test-Path $npmPath) {
            Write-Host "✅ Found npm at: $npmPath" -ForegroundColor Green
        } else {
            throw "npm not found"
        }
    } catch {
        Write-Host "❌ Could not locate npm. Please ensure Node.js is properly installed." -ForegroundColor Red
        Write-Host "You can download Node.js from: https://nodejs.org/" -ForegroundColor Blue
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check Node.js version
try {
    $nodeVersion = & node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Blue
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm version
try {
    $npmVersion = & npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Blue
} catch {
    Write-Host "❌ npm not working properly" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Start the development server
Write-Host "🚀 Starting Reconciliation App on http://localhost:1000..." -ForegroundColor Green
Write-Host "📝 Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Open the launcher page in browser
Start-Process "launcher.html"

# Start the development server
& npm run dev
