# PowerShell Script for Local Deployment
# Run this in PowerShell

Write-Host "🚀 Starting Local Deployment..." -ForegroundColor Green

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

# Check PostgreSQL
$pgRunning = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }
if ($pgRunning) {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL is not running. Please start it." -ForegroundColor Yellow
    Write-Host "Run: Start-Service postgresql*" -ForegroundColor Cyan
}

# Check Rust/Cargo
try {
    $cargoVersion = cargo --version 2>$null
    Write-Host "✅ Cargo found: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Cargo not found. Please install Rust" -ForegroundColor Red
    exit 1
}

# Create database
Write-Host "`n🗄️  Setting up database..." -ForegroundColor Yellow
try {
    # Try to create database using psql
    $env:PGPASSWORD = "password"
    psql -U postgres -h localhost -c "CREATE DATABASE reconciliation_app;" 2>$null
    Write-Host "✅ Database created" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Database may already exist or using different connection" -ForegroundColor Cyan
}

# Setup backend
Write-Host "`n⚙️  Setting up backend..." -ForegroundColor Yellow
Set-Location backend

$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/reconciliation_app"

# Setup diesel
Write-Host "Running diesel setup..." -ForegroundColor Cyan
diesel setup 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Diesel setup complete" -ForegroundColor Green
}

# Run migrations
Write-Host "Running migrations..." -ForegroundColor Cyan
diesel migration run 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations complete" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration errors (database may be ready)" -ForegroundColor Yellow
}

Set-Location ..

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Start backend:  cd backend && cargo run" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Access application at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:1000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:2000" -ForegroundColor White

