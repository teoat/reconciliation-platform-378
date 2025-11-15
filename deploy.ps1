# PowerShell Deployment Script
# Run this script to deploy the Reconciliation Platform

Write-Host "🚀 Starting Deployment..." -ForegroundColor Green

# Check if we're in the right directory
if (!(Test-Path "docker-compose.yml")) {
    Write-Host "❌ Please run this script from the project root" -ForegroundColor Red
    exit 1
}

# Check Docker
Write-Host "`nChecking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Yellow
    Write-Host "Press any key after starting Docker..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Check PostgreSQL
Write-Host "`nChecking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }
if (!$pgRunning) {
    Write-Host "⚠️  PostgreSQL may not be running locally" -ForegroundColor Yellow
    Write-Host "The database will be started via Docker Compose" -ForegroundColor Green
}

# Run migrations (if database is available)
Write-Host "`nAttempting to run migrations..." -ForegroundColor Yellow
Set-Location backend
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/reconciliation_app"

# Try to run diesel setup
try {
    $setupOutput = diesel setup 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database setup complete" -ForegroundColor Green
        diesel migration run 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrations completed" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Migrations may need to be run after database is available" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "ℹ️  Migrations will be run when database is available" -ForegroundColor Cyan
}

Set-Location ..

# Start Docker Compose
Write-Host "`n🚀 Starting Docker Compose..." -ForegroundColor Green
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services started successfully!" -ForegroundColor Green
    Write-Host "`n📍 Services:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:1000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:2000" -ForegroundColor White
    Write-Host "   Database: localhost:5432" -ForegroundColor White
    
    Write-Host "`n📊 Check logs with:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs -f" -ForegroundColor White
    
    Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    Write-Host "Run 'docker-compose logs' to see errors" -ForegroundColor Yellow
}

