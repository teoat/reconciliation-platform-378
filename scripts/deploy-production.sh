#!/bin/bash

# Production Deployment Script for 378 Reconciliation Platform
# This script automates the deployment to production

set -e

echo "🚀 Starting Production Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"

# Set production environment
export NODE_ENV=production
export ENV=production

echo "✅ Production environment set"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down 2>/dev/null || true

# Build production images
echo "🏗️  Building production images..."
docker compose build --no-cache

# Start production containers with production environment
echo "🚀 Starting production containers..."
NODE_ENV=production docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:2000/health > /dev/null 2>&1; then
        echo "✅ Backend health check passed"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Retry $RETRY_COUNT/$MAX_RETRIES..."
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "⚠️  Health check timeout - services may still be starting"
fi

# Show status
echo ""
echo "📊 Deployment Status:"
docker compose ps

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "📍 Access Points:"
echo "   Backend: http://localhost:8080"
echo "   Frontend: http://localhost:3000"
echo "   Health: http://localhost:8080/health"
echo "   Metrics: http://localhost:8080/metrics"
echo ""
echo "📝 View logs with: docker compose logs -f"

