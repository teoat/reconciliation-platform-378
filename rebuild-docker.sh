#!/bin/bash
# Complete Docker Rebuild Script
# Usage: ./rebuild-docker.sh

set -e

echo "🐳 Starting Docker Complete Rebuild..."
echo "======================================"

# Step 1: Stop and remove all containers and volumes
echo ""
echo "📦 Step 1: Cleaning up existing containers..."
docker compose down -v || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Step 2: Remove old images
echo ""
echo "🗑️  Step 2: Removing old images..."
docker images | grep -E "(reconciliation|378)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# Step 3: Build base services first (don't need building)
echo ""
echo "🚀 Step 3: Starting base services (postgres, redis)..."
docker compose up -d postgres redis

# Wait for services to be ready
echo "⏳ Waiting for postgres and redis to be ready..."
sleep 10

# Step 4: Build backend
echo ""
echo "🔨 Step 4: Building backend image..."
docker compose build --no-cache backend

# Step 5: Build frontend
echo ""
echo "🔨 Step 5: Building frontend image..."
docker compose build --no-cache frontend

# Step 6: Start all services
echo ""
echo "🚀 Step 6: Starting all services..."
docker compose up -d

# Step 7: Show status
echo ""
echo "✅ Rebuild complete!"
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "📝 To view logs:"
echo "   docker compose logs -f [service-name]"
echo ""
echo "🔍 To check health:"
echo "   curl http://localhost:2000/ready  # Backend"
echo "   curl http://localhost:1000       # Frontend"
echo ""

