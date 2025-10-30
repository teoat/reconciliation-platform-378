#!/bin/bash
# ============================================================================
# Docker Deployment Script for Reconciliation Platform
# ============================================================================
# This script deploys all services using docker-compose
# ============================================================================

set -e

echo "🚀 Reconciliation Platform - Docker Deployment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file. Please update with your values.${NC}"
    else
        echo -e "${RED}❌ .env.example not found. Please create .env file manually.${NC}"
        exit 1
    fi
fi

# Check required environment variables
source .env
REQUIRED_VARS=("JWT_SECRET" "POSTGRES_PASSWORD" "REDIS_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" == "change-this-in-production" ] || [ "${!var}" == "redis_pass" ] || [ "${!var}" == "postgres_pass" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing or default values for required variables:${NC}"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo -e "${YELLOW}Please update .env file with secure values.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Build images with cache
echo ""
echo "📦 Building Docker images (this may take several minutes)..."
DOCKER_BUILDKIT=1 docker-compose build --parallel

# Apply database migrations and indexes
echo ""
echo "📊 Setting up database..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
sleep 10

# Run migrations (if diesel is available in container or via exec)
echo "🔄 Running database migrations..."
docker-compose exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-reconciliation_app} -c "SELECT version();" || echo "Waiting for postgres..."

# Apply performance indexes
if [ -f backend/apply-indexes.sh ]; then
    echo "📈 Applying performance indexes..."
    bash backend/apply-indexes.sh || echo "⚠️  Could not apply indexes automatically. Manual application may be needed."
fi

# Start all services
echo ""
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

# Health check
echo ""
echo "🏥 Checking service health..."
if curl -f http://localhost:${BACKEND_PORT:-2000}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed. Check logs with: docker-compose logs backend${NC}"
fi

if curl -f http://localhost:${FRONTEND_PORT:-1000} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend check failed. Check logs with: docker-compose logs frontend${NC}"
fi

# Display service URLs
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=============================================="
echo ""
echo "Service URLs:"
echo "  Backend API:    http://localhost:${BACKEND_PORT:-2000}"
echo "  Frontend:       http://localhost:${FRONTEND_PORT:-1000}"
echo "  Prometheus:     http://localhost:${PROMETHEUS_PORT:-9090}"
echo "  Grafana:        http://localhost:${GRAFANA_PORT:-3001} (admin/${GRAFANA_PASSWORD:-admin})"
echo ""
echo "Useful commands:"
echo "  View logs:      docker-compose logs -f [service]"
echo "  Stop services:  docker-compose down"
echo "  Restart:        docker-compose restart [service]"
echo "  Status:         docker-compose ps"
echo ""