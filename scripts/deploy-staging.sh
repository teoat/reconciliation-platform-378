#!/bin/bash
# ============================================================================
# DEPLOY TO STAGING ENVIRONMENT
# ============================================================================
# This script deploys the Reconciliation Platform to staging
# ============================================================================

set -e  # Exit on error

echo "🚀 Deploying to Staging Environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Looking for template..."
    if [ -f "env.template" ]; then
        cp env.template .env
        echo "✅ Created .env file from env.template."
        echo "⚠️  Using default values. Please update .env with your configuration."
        echo "⚠️  Continuing with deployment using default values..."
    elif [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example."
        echo "⚠️  Using default values. Please update .env with your configuration."
        echo "⚠️  Continuing with deployment using default values..."
    else
        echo "⚠️  No environment template found. Creating minimal .env file..."
        cat > .env << 'EOF'
# Docker Compose Environment Variables
POSTGRES_PASSWORD=postgres_pass
GRAFANA_PASSWORD=admin
EOF
        echo "✅ Created minimal .env file."
        echo "⚠️  Using default values. Update .env for production."
    fi
fi

echo "📦 Building and starting services..."
echo ""

# Pull latest images
echo "🔄 Pulling latest Docker images..."
docker compose pull 2>/dev/null || docker compose pull 2>/dev/null || echo "⚠️  Warning: Could not pull images"

# Build and start services
echo "🏗️  Building and starting containers..."
docker compose up -d --build 2>/dev/null || docker-compose up -d --build

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Health checks
echo ""
echo "🔍 Running health checks..."

# Check backend
if curl -f http://localhost:2000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    echo "📋 Backend logs:"
    (docker compose logs --tail=50 backend 2>/dev/null || docker-compose logs --tail=50 backend)
    exit 1
fi

# Check frontend
if curl -f http://localhost:1000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    echo "📋 Frontend logs:"
    (docker compose logs --tail=50 frontend 2>/dev/null || docker-compose logs --tail=50 frontend)
    exit 1
fi

# Check database
if (docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1 || docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1); then
    echo "✅ Database is healthy"
else
    echo "❌ Database health check failed"
    exit 1
fi

# Check Redis
if (docker compose exec -T redis redis-cli ping > /dev/null 2>&1 || docker-compose exec -T redis redis-cli ping > /dev/null 2>&1); then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📊 Service Status:"
docker compose ps 2>/dev/null || docker-compose ps
echo ""
echo "🌐 Access URLs:"
echo "  Frontend:    http://localhost:1000"
echo "  Backend API: http://localhost:2000/api"
echo "  Health:      http://localhost:2000/health"
echo "  Metrics:     http://localhost:2000/metrics"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3000 (admin/password from .env)"
echo ""
echo "📋 Useful commands:"
echo "  View logs:        docker compose logs -f"
echo "  Stop services:    docker compose down"
echo "  Restart service:  docker compose restart <service>"
echo ""
echo "✅ Staging deployment complete!"

