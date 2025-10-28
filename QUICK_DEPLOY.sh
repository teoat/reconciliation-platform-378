#!/bin/bash
# 🚀 Quick Deploy Script - 378 Reconciliation Platform
# This script deploys the platform in 3 easy steps

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "================================================"
echo "  378 Reconciliation Platform - Quick Deploy"
echo "================================================"
echo -e "${NC}"

# Step 1: Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating one...${NC}"
    cat > .env << 'EOF'
# Basic Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_pass

# Backend
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:1000

# Ports
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=2000
FRONTEND_PORT=1000
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EOF
    echo -e "${GREEN}✅ Created .env file${NC}"
    echo -e "${YELLOW}💡 Edit .env if you need custom configuration${NC}"
    sleep 2
fi

# Step 2: Start services
echo ""
echo -e "${GREEN}📦 Starting all services...${NC}"
docker compose up -d --build

# Step 3: Wait for services
echo ""
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 15

# Check health
echo ""
echo -e "${GREEN}🔍 Checking service health...${NC}"

# Check backend
for i in {1..30}; do
    if curl -f http://localhost:2000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        echo "Check logs with: docker compose logs backend"
        exit 1
    fi
    sleep 2
done

# Check frontend
for i in {1..10}; do
    if curl -f http://localhost:1000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is ready${NC}"
        break
    fi
    sleep 2
done

# Success!
echo ""
echo -e "${GREEN}================================================"
echo "  🎉 Deployment Complete!"
echo "================================================"
echo -e "${NC}"
echo ""
echo "🌐 Your platform is available at:"
echo "   Frontend:  http://localhost:1000"
echo "   Backend:   http://localhost:2000"
echo "   Health:    http://localhost:2000/api/health"
echo "   Grafana:   http://localhost:3001"
echo ""
echo "📊 Useful commands:"
echo "   View logs:    docker compose logs -f backend"
echo "   Stop:         docker compose down"
echo "   Restart:      docker compose restart"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:1000 in your browser"
echo "   2. Register a new user account"
echo "   3. Start using the platform!"
echo ""
echo -e "${GREEN}Enjoy! 🚀${NC}"

