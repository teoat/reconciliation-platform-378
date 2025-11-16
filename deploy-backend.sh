#!/bin/bash

# ============================================================================
# Backend Docker Compose Deployment Script
# ============================================================================
# This script builds and deploys the backend service using Docker Compose
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    echo ""
}

# Check if Docker is running
check_docker() {
    print_info "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    print_info "Checking Docker Compose..."
    if ! docker compose version > /dev/null 2>&1; then
        print_error "Docker Compose is not available. Please install Docker Compose v2.0+"
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Check/create .env file
check_env_file() {
    print_info "Checking environment configuration..."
    
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from defaults..."
        
        # Generate secure JWT secret
        JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-in-production-$(date +%s)")
        
        cat > .env << EOF
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_pass
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=redis_pass
REDIS_PORT=6379

# Backend Configuration
BACKEND_PORT=2000
HOST=0.0.0.0
PORT=2000

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=86400

# CORS
CORS_ORIGINS=http://localhost:1000,http://localhost:3000,http://localhost:5173

# Logging
RUST_LOG=info
LOG_FORMAT=json

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/app/uploads

# Environment
ENVIRONMENT=development
EOF
        print_success ".env file created with default values"
        print_warning "⚠️  Please review and update .env file with production values!"
    else
        print_success ".env file exists"
    fi
}

# Build backend image
build_backend() {
    print_header "Building Backend Docker Image"
    
    print_info "Building with BuildKit for faster builds..."
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Use backend-only compose file if it exists
    COMPOSE_FILE=""
    if [ -f "docker-compose.backend.yml" ]; then
        COMPOSE_FILE="-f docker-compose.backend.yml"
        print_info "Using docker-compose.backend.yml"
    fi
    
    print_info "Building backend service..."
    docker compose $COMPOSE_FILE build backend
    
    print_success "Backend image built successfully"
}

# Start backend service
start_backend() {
    print_header "Starting Backend Service"
    
    # Use backend-only compose file if it exists
    COMPOSE_FILE=""
    if [ -f "docker-compose.backend.yml" ]; then
        COMPOSE_FILE="-f docker-compose.backend.yml"
        print_info "Using docker-compose.backend.yml"
    fi
    
    # Check if backend is already running
    if docker compose $COMPOSE_FILE ps backend 2>/dev/null | grep -q "Up"; then
        print_warning "Backend is already running. Stopping first..."
        docker compose $COMPOSE_FILE stop backend
        docker compose $COMPOSE_FILE rm -f backend
    fi
    
    print_info "Starting backend service and dependencies..."
    docker compose $COMPOSE_FILE up -d
    
    print_success "Backend service started"
}

# Wait for backend to be healthy
wait_for_backend() {
    print_header "Waiting for Backend to be Healthy"
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    HEALTH_CHECK_URL="http://localhost:2000/api/health"
    
    print_info "Checking health at: $HEALTH_CHECK_URL"
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
            print_success "Backend is healthy!"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        print_info "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
        sleep 2
    done
    
    print_error "Backend health check failed after $MAX_RETRIES retries"
    print_warning "Backend may still be starting. Check logs with: docker compose logs -f backend"
    return 1
}

# Show deployment status
show_status() {
    print_header "Deployment Status"
    
    # Use backend-only compose file if it exists
    COMPOSE_FILE=""
    if [ -f "docker-compose.backend.yml" ]; then
        COMPOSE_FILE="-f docker-compose.backend.yml"
    fi
    
    echo ""
    print_info "Container Status:"
    docker compose $COMPOSE_FILE ps
    
    echo ""
    print_info "Backend Logs (last 20 lines):"
    docker compose $COMPOSE_FILE logs --tail=20 backend
    
    echo ""
    print_info "Access Points:"
    echo "  - Backend API: http://localhost:2000"
    echo "  - Health Check: http://localhost:2000/api/health"
    echo "  - Metrics: http://localhost:2000/metrics"
    
    echo ""
    print_info "Useful Commands:"
    if [ -f "docker-compose.backend.yml" ]; then
        echo "  - View logs: docker compose -f docker-compose.backend.yml logs -f backend"
        echo "  - Stop backend: docker compose -f docker-compose.backend.yml stop"
        echo "  - Restart backend: docker compose -f docker-compose.backend.yml restart backend"
        echo "  - Remove backend: docker compose -f docker-compose.backend.yml down"
    else
        echo "  - View logs: docker compose logs -f backend"
        echo "  - Stop backend: docker compose stop backend"
        echo "  - Restart backend: docker compose restart backend"
        echo "  - Remove backend: docker compose down backend"
    fi
}

# Main deployment flow
main() {
    print_header "Backend Docker Compose Deployment"
    
    # Pre-flight checks
    check_docker
    check_docker_compose
    check_env_file
    
    # Build and deploy
    build_backend
    start_backend
    
    # Wait for health check
    if wait_for_backend; then
        show_status
        print_success "Backend deployment completed successfully!"
    else
        show_status
        print_warning "Deployment completed but health check failed. Please check logs."
        exit 1
    fi
}

# Run main function
main "$@"

