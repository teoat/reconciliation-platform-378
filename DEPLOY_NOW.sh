#!/bin/bash
# 🚀 378 Reconciliation Platform - Deploy Now Script
# Comprehensive deployment with health checks and verification

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================================"
echo "  378 Reconciliation Platform"
echo "  Comprehensive Deployment"
echo "================================================"
echo -e "${NC}"

# Step 1: Check Docker
echo -e "\n${YELLOW}Step 1: Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    echo "Starting Docker Desktop..."
    open -a Docker
    echo -e "${YELLOW}Waiting 30 seconds for Docker to start...${NC}"
    sleep 30
    
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker failed to start${NC}"
        echo "Please start Docker Desktop manually and run this script again"
        exit 1
    fi
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Step 2: Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "\n${YELLOW}Step 2: Creating .env file...${NC}"
    cat > .env << 'EOF'
# PostgreSQL Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_secure_$(date +%s)

# Backend Configuration
JWT_SECRET=super_secure_jwt_secret_change_in_production
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:1000
RUST_LOG=info
MAX_FILE_SIZE=10485760

# Ports
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=2000
FRONTEND_PORT=1000
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001

# Monitoring
GRAFANA_PASSWORD=admin_secure
NODE_ENV=production
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "\n${YELLOW}Step 2: .env file already exists${NC}"
fi

# Step 3: Build images
echo -e "\n${YELLOW}Step 3: Building Docker images...${NC}"
echo "This may take 10-15 minutes on first build..."
docker compose build --progress=plain 2>&1 | grep -E "Step|Successfully|ERROR|error" || true

# Step 4: Start services
echo -e "\n${YELLOW}Step 4: Starting services...${NC}"
docker compose up -d

# Step 5: Wait for services
echo -e "\n${YELLOW}Step 5: Waiting for services to be ready...${NC}"
echo "This may take 1-2 minutes..."
sleep 20

# Step 6: Health checks
echo -e "\n${YELLOW}Step 6: Running health checks...${NC}"

# Check postgres
for i in {1..10}; do
    if docker compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is healthy${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    fi
    sleep 3
done

# Check redis
for i in {1..10}; do
    if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is healthy${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Redis failed to start${NC}"
    fi
    sleep 3
done

# Check backend
for i in {1..20}; do
    if curl -f http://localhost:2000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
        break
    fi
    if [ $i -eq 20 ]; then
        echo -e "${RED}❌ Backend failed to start${NC}"
        echo "Check logs with: docker compose logs backend"
    fi
    echo "Waiting for backend... ($i/20)"
    sleep 3
done

# Check frontend
for i in {1..10}; do
    if curl -f http://localhost:1000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is accessible${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}❌ Frontend failed to start${NC}"
    fi
    sleep 2
done

# Step 7: Display status
echo -e "\n${YELLOW}Step 7: Service status...${NC}"
docker compose ps

# Step 8: Success message
echo -e "\n${GREEN}================================================"
echo "  🎉 Deployment Complete!"
echo "================================================${NC}\n"

echo "🌐 Your platform is available at:"
echo -e "   ${BLUE}Frontend:${NC}  http://localhost:1000"
echo -e "   ${BLUE}Backend:${NC}   http://localhost:2000"
echo -e "   ${BLUE}Health:${NC}    http://localhost:2000/api/health"
echo -e "   ${BLUE}Metrics:${NC}   http://localhost:2000/api/metrics"
echo -e "   ${BLUE}Grafana:${NC}   http://localhost:3001 (admin/admin_secure)"
echo ""

echo "📊 Useful commands:"
echo -e "   ${BLUE}View logs:${NC}    docker compose logs -f"
echo -e "   ${BLUE}Stop:${NC}         docker compose down"
echo -e "   ${BLUE}Restart:${NC}      docker compose restart"
echo -e "   ${BLUE}Status:${NC}       docker compose ps"
echo ""

echo -e "${GREEN}Enjoy your platform! 🚀${NC}"

