# PowerShell script to start frontend
# Set PATH to include Node.js
$env:PATH = "/usr/local/Cellar/node/24.10.0/bin:$env:PATH"

Write-Host "🚀 Starting Frontend..." -ForegroundColor Green
Write-Host ""

# Navigate to frontend directory
Set-Location frontend

Write-Host "📦 Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎨 Starting development server..." -ForegroundColor Yellow
Write-Host ""

# Start dev server
npm run dev

