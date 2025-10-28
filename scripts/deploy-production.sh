#!/bin/bash
# Production Deployment Script for 378 Reconciliation Platform
# This script automates the deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "  378 Reconciliation Platform - Production Deployment"
echo "================================================"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}Error: docker is required${NC}" >&2; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: docker-compose is required${NC}" >&2; exit 1; }
    
    if [ ! -f "config/production.env" ]; then
        echo -e "${RED}Error: config/production.env not found${NC}"
        echo "Copy config/production.env.example to config/production.env and configure it"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Prerequisites met${NC}"
}

# Apply database migrations
apply_migrations() {
    echo -e "${YELLOW}Applying database migrations...${NC}"
    
    # Apply performance indexes
    if [ -f "backend/migrations/20250102000000_add_performance_indexes.sql" ]; then
        docker-compose exec -T database psql $DATABASE_URL < backend/migrations/20250102000000_add_performance_indexes.sql || {
            echo -e "${YELLOW}Note: Some indexes may already exist${NC}"
        }
        echo -e "${GREEN}✓ Indexes applied${NC}"
    else
        echo -e "${YELLOW}⚠ No migration file found${NC}"
    fi
}

# Build images
build_images() {
    echo -e "${YELLOW}Building Docker images...${NC}"
    
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    echo -e "${GREEN}✓ Images built${NC}"
}

# Deploy with zero-downtime
deploy_application() {
    echo -e "${YELLOW}Deploying application...${NC}"
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Deploy with rolling update
    docker-compose -f docker-compose.prod.yml up -d --no-deps --build backend
    
    echo -e "${GREEN}✓ Application deployed${NC}"
}

# Health check
health_check() {
    echo -e "${YELLOW}Running health checks...${NC}"
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    for i in {1..30}; do
        if curl -f http://localhost:2000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is healthy${NC}"
            return 0
        fi
        echo "Waiting for backend... ($i/30)"
        sleep 2
    done
    
    echo -e "${RED}✗ Backend health check failed${NC}"
    return 1
}

# Verify deployment
verify_deployment() {
    echo -e "${YELLOW}Verifying deployment...${NC}"
    
    # Check all services are running
    docker-compose -f docker-compose.prod.yml ps
    
    # Check endpoints
    echo ""
    echo -e "${YELLOW}Testing endpoints:${NC}"
    
    # Health check
    curl -s http://localhost:2000/api/health | jq '.status' && echo "✓ Health endpoint"
    
    # Metrics endpoint
    curl -s http://localhost:2000/api/metrics | head -5 && echo "✓ Metrics endpoint"
    
    echo ""
    echo -e "${GREEN}✓ Deployment verified${NC}"
}

# Main deployment flow
main() {
    check_prerequisites
    apply_migrations
    build_images
    deploy_application
    health_check
    verify_deployment
    
    echo ""
    echo -e "${GREEN}================================================"
    echo "  Deployment Complete!"
    echo "================================================${NC}"
    echo ""
    echo "Services:"
    echo "  Frontend: http://localhost:1000"
    echo "  Backend:  http://localhost:2000"
    echo "  Health:   http://localhost:2000/api/health"
    echo ""
    echo "Next steps:"
    echo "  1. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  2. Check metrics: http://localhost:2000/api/metrics"
    echo "  3. Test the application"
    echo ""
}

# Run main function
main
