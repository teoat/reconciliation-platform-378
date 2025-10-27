#!/bin/bash
# Production Deployment Script

set -e

echo "🚀 Starting production deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.production.yml"

echo -e "${YELLOW}Deploying to: ${ENVIRONMENT}${NC}"

# Step 1: Pull latest code
echo -e "${GREEN}Step 1: Pulling latest code...${NC}"
git pull origin main

# Step 2: Build images
echo -e "${GREEN}Step 2: Building Docker images...${NC}"
docker-compose -f ${COMPOSE_FILE} build --no-cache

# Step 3: Run tests
echo -e "${GREEN}Step 3: Running tests...${NC}"
cd backend && cargo test --release || exit 1
cd ..

# Step 4: Stop old containers
echo -e "${GREEN}Step 4: Stopping old containers...${NC}"
docker-compose -f ${COMPOSE_FILE} down

# Step 5: Start new containers
echo -e "${GREEN}Step 5: Starting new containers...${NC}"
docker-compose -f ${COMPOSE_FILE} up -d

# Step 6: Wait for services
echo -e "${GREEN}Step 6: Waiting for services to be healthy...${NC}"
sleep 10

# Step 7: Run database migrations
echo -e "${GREEN}Step 7: Running database migrations...${NC}"
docker-compose -f ${COMPOSE_FILE} exec -T backend diesel migration run || true

# Step 8: Health check
echo -e "${GREEN}Step 8: Running health checks...${NC}"
curl -f http://localhost:8080/health || exit 1

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo -e "${GREEN}🎉 Application is running on:${NC}"
echo -e "   - Backend: http://localhost:8080"
echo -e "   - Frontend: http://localhost:80"
echo -e "   - API Docs: http://localhost:8080/api/docs"
