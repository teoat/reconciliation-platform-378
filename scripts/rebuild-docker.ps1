# Complete Docker Rebuild Script (PowerShell)
# Usage: .\rebuild-docker.ps1

Write-Host "🐳 Starting Docker Complete Rebuild..." -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Step 1: Stop and remove all containers and volumes
Write-Host ""
Write-Host "📦 Step 1: Cleaning up existing containers..." -ForegroundColor Yellow
docker compose down -v
$containers = docker ps -aq
if ($containers) {
    docker stop $containers | Out-Null
    docker rm -f $containers | Out-Null
}

# Step 2: Remove old images
Write-Host ""
Write-Host "🗑️  Step 2: Removing old images..." -ForegroundColor Yellow
docker images | Select-String -Pattern "(reconciliation|378)" | ForEach-Object {
    $imageId = ($_ -split '\s+')[2]
    if ($imageId -ne "IMAGE") {
        docker rmi -f $imageId 2>$null
    }
}

# Step 3: Build base services first
Write-Host ""
Write-Host "🚀 Step 3: Starting base services (postgres, redis)..." -ForegroundColor Yellow
docker compose up -d postgres redis

# Wait for services to be ready
Write-Host "⏳ Waiting for postgres and redis to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Build backend
Write-Host ""
Write-Host "🔨 Step 4: Building backend image..." -ForegroundColor Yellow
docker compose build --no-cache backend

# Step 5: Build frontend
Write-Host ""
Write-Host "🔨 Step 5: Building frontend image..." -ForegroundColor Yellow
docker compose build --no-cache frontend

# Step 6: Start all services
Write-Host ""
Write-Host "🚀 Step 6: Starting all services..." -ForegroundColor Yellow
docker compose up -d

# Step 7: Show status
Write-Host ""
Write-Host "✅ Rebuild complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "📝 To view logs:" -ForegroundColor Cyan
Write-Host "   docker compose logs -f [service-name]"
Write-Host ""
Write-Host "🔍 To check health:" -ForegroundColor Cyan
Write-Host "   curl http://localhost:2000/ready  # Backend"
Write-Host "   curl http://localhost:1000       # Frontend"
Write-Host ""

