#!/bin/bash
# 🚀 Reconciliation Platform - Quick Start Deployment Script
# This script helps you deploy the platform quickly

set -e

echo "🚀 Reconciliation Platform - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    echo -e "${BLUE}Checking Docker...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo -e "${YELLOW}Please start Docker Desktop and try again${NC}"
        echo -e "${YELLOW}On macOS, run: open -a Docker${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
    echo ""
}

# Function to check if ports are available
check_ports() {
    echo -e "${BLUE}Checking required ports...${NC}"
    
    ports=(5432 6379 2000 1000 9090 3000)
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
            echo -e "${YELLOW}⚠️  Port $port is already in use${NC}"
        else
            echo -e "${GREEN}✅ Port $port is available${NC}"
        fi
    done
    echo ""
}

# Function to start services
start_services() {
    echo -e "${BLUE}Starting all services...${NC}"
    
    # Pull latest images if needed
    echo -e "${YELLOW}Pulling latest images...${NC}"
    docker compose pull 2>/dev/null || echo "Using local images"
    
    # Start services
    echo -e "${YELLOW}Starting services in detached mode...${NC}"
    docker compose up -d
    
    echo -e "${GREEN}✅ Services started${NC}"
    echo ""
}

# Function to wait for services to be ready
wait_for_services() {
    echo -e "${BLUE}Waiting for services to be ready...${NC}"
    
    max_attempts=30
    attempt=0
    
    # Wait for database
    echo -e "${YELLOW}Waiting for database...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T database pg_isready -U reconciliation_user > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database is ready${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""
    
    # Wait for Redis
    echo -e "${YELLOW}Waiting for Redis...${NC}"
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Redis is ready${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""
    
    # Wait for backend
    echo -e "${YELLOW}Waiting for backend...${NC}"
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost:2000/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready${NC}"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        echo -n "."
    done
    echo ""
}

# Function to display service status
show_status() {
    echo -e "${BLUE}Service Status:${NC}"
    echo ""
    docker compose ps
    echo ""
}

# Function to display URLs
show_urls() {
    echo -e "${GREEN}✅ Deployment Complete!${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Frontend:    ${GREEN}http://localhost:1000${NC}"
    echo -e "  Backend API: ${GREEN}http://localhost:2000${NC}"
    echo -e "  Health:      ${GREEN}http://localhost:2000/health${NC}"
    echo ""
    echo -e "${BLUE}Useful Commands:${NC}"
    echo -e "  View logs:   ${YELLOW}docker compose logs -f${NC}"
    echo -e "  Stop:        ${YELLOW}docker compose down${NC}"
    echo -e "  Status:      ${YELLOW}docker compose ps${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}Starting deployment process...${NC}"
    echo ""
    
    # Check prerequisites
    check_docker
    check_ports
    
    # Confirm deployment
    echo -e "${YELLOW}Do you want to start all services? (y/n)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
    echo ""
    
    # Start services
    start_services
    
    # Wait for services
    wait_for_services
    
    # Show status
    show_status
    
    # Show URLs
    show_urls
}

# Run main function
main

