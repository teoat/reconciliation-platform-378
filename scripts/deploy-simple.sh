#!/bin/bash

# Simplified Production Deployment Script
# This version works around Docker credential issues

set -e

echo "🚀 Starting Production Deployment (Simplified)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Set production environment
export NODE_ENV=production

echo "✅ Production environment set"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

# Start containers without building (use existing or pull images)
echo "🚀 Starting production containers..."
NODE_ENV=production docker compose up -d --force-recreate

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check status
echo ""
echo "📊 Deployment Status:"
docker compose ps

# Health check with timeout
echo ""
echo "🏥 Performing health check..."
MAX_RETRIES=20
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:2000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 3
done

echo ""
echo "✅ Production deployment initiated!"
echo ""
echo "📍 Access Points:"
echo "   Backend: http://localhost:2000"
echo "   Frontend: http://localhost:1000"
echo "   Health: http://localhost:2000/health"
echo ""
echo "📝 View logs with: docker compose logs -f"
echo "📝 Check status with: docker compose ps"

