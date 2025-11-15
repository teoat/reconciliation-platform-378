#!/bin/bash

# Frontend Deployment Script
# This script builds and deploys the frontend

set -euo pipefail

echo "🚀 Frontend Deployment Script"
echo "================================"
echo ""

cd "$(dirname "$0")"

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  docker-compose not found. Trying 'docker compose'..."
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo "✅ Using: $DOCKER_COMPOSE"
echo ""

# Option 1: Build and deploy with docker-compose
echo "📦 Building Frontend Docker Image..."
$DOCKER_COMPOSE build --no-cache frontend

echo ""
echo "🚀 Starting Frontend..."
$DOCKER_COMPOSE up -d frontend

echo ""
echo "⏳ Waiting for frontend to be ready..."
sleep 5

echo ""
echo "✅ Checking Frontend Status..."
$DOCKER_COMPOSE ps frontend

echo ""
echo "📊 Viewing Recent Logs..."
$DOCKER_COMPOSE logs --tail=20 frontend

echo ""
echo "🌐 Frontend should be accessible at: http://localhost:1000"
echo ""
echo "📝 Useful Commands:"
echo "  View logs:        $DOCKER_COMPOSE logs -f frontend"
echo "  Restart:          $DOCKER_COMPOSE restart frontend"
echo "  Stop:             $DOCKER_COMPOSE stop frontend"
echo "  Rebuild:          $DOCKER_COMPOSE build --no-cache frontend && $DOCKER_COMPOSE up -d frontend"
echo ""
echo "✅ Frontend deployment complete!"

