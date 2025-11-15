#!/bin/bash

# '
# Staging Deployment Script for 378 Reconciliation Platform
# This script sets up and deploys all services to a staging environment
#

set -e  # Exit on error

echo "=========================================="
echo "378 Reconciliation Platform - Staging Deployment"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found${NC}"
    exit 1
fi

# Check environment files
echo -e "${BLUE}Checking environment files...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Warning: backend/.env not found, creating default...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || echo "Please create backend/.env"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Warning: frontend/.env not found, creating default...${NC}"
    cp frontend/.env.example frontend/.env 2>/dev/null || echo "Please create frontend/.env"
fi

# Stop existing containers
echo -e "${BLUE}Stopping existing containers...${NC}"
docker compose down

# Build images
echo -e "${BLUE}Building Docker images...${NC}"
docker compose build --no-cache

# Start services
echo -e "${BLUE}Starting services...${NC}"
docker compose up -d

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Health checks
echo -e "${BLUE}Running health checks...${NC}"

# Check backend
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:2000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
        break
    fi
    echo -e "${YELLOW}Waiting for backend... (attempt $((attempt+1))/$max_attempts)${NC}"
    sleep 2
    attempt=$((attempt+1))
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo -e "${BLUE}Backend logs:${NC}"
    docker compose logs backend --tail=50
    exit 1
fi

# Display service status
echo -e "${BLUE}Service Status:${NC}"
docker compose ps

# Display access information
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Access Points:"
echo "  Frontend:    http://localhost:1000"
echo "  Backend API: http://localhost:2000"
echo "  Health:      http://localhost:2000/health"
echo "  Metrics:     http://localhost:2000/metrics"
echo ""
echo "Monitoring:"
echo "  Prometheus:  http://localhost:9090"
echo "  Grafana:     http://localhost:3000 (admin/admin)"
echo ""
echo "Useful Commands:"
echo "  View logs:     docker compose logs -f [service]"
echo "  Stop services: docker compose down"
echo "  Restart:       docker compose restart [service]"
echo ""

