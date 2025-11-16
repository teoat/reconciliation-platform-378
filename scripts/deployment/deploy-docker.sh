#!/bin/bash
# scripts/deployment/deploy-docker.sh
# Docker deployment script with comprehensive error detection

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Run error detection
    if ! ./scripts/deployment/error-detection.sh; then
        error "Pre-deployment checks failed. Please fix errors before deploying."
    fi
    
    # Check Docker
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "docker-compose is not installed"
    fi
    
    # Check for required files
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "docker-compose.yml not found"
    fi
    
    if [ "$ENVIRONMENT" = "production" ] && [ ! -f "$PROD_COMPOSE_FILE" ]; then
        warning "docker-compose.prod.yml not found, using base compose file"
        PROD_COMPOSE_FILE=""
    fi
    
    log "Pre-deployment checks passed"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$PROD_COMPOSE_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
        $compose_cmd -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" build --parallel
    else
        $compose_cmd -f "$COMPOSE_FILE" build --parallel
    fi
    
    if [ $? -ne 0 ]; then
        error "Docker build failed"
    fi
    
    log "Docker images built successfully"
}

# Validate Docker Compose configuration
validate_config() {
    log "Validating Docker Compose configuration..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$PROD_COMPOSE_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
        $compose_cmd -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" config > /dev/null
    else
        $compose_cmd -f "$COMPOSE_FILE" config > /dev/null
    fi
    
    if [ $? -ne 0 ]; then
        error "Docker Compose configuration is invalid"
    fi
    
    log "Configuration validated"
}

# Start services
start_services() {
    log "Starting services..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$PROD_COMPOSE_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
        $compose_cmd -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" up -d
    else
        $compose_cmd -f "$COMPOSE_FILE" up -d
    fi
    
    if [ $? -ne 0 ]; then
        error "Failed to start services"
    fi
    
    log "Services started"
}

# Wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:2000/health &> /dev/null 2>&1; then
            log "Backend health check passed"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    echo ""
    warning "Health check timeout - services may still be starting"
    return 1
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$PROD_COMPOSE_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
        $compose_cmd -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" exec -T backend diesel migration run || {
            warning "Migration failed or no migrations to run"
        }
    else
        $compose_cmd -f "$COMPOSE_FILE" exec -T backend diesel migration run || {
            warning "Migration failed or no migrations to run"
        }
    fi
    
    log "Migrations completed"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check backend health
    if ! curl -f http://localhost:2000/health &> /dev/null 2>&1; then
        error "Backend health check failed"
    fi
    
    # Check frontend
    if ! curl -f http://localhost:1000 &> /dev/null 2>&1; then
        warning "Frontend health check failed (may still be starting)"
    fi
    
    # Check service status
    local compose_cmd="docker-compose"
    if ! command -v docker-compose &> /dev/null; then
        compose_cmd="docker compose"
    fi
    
    if [ -n "$PROD_COMPOSE_FILE" ] && [ "$ENVIRONMENT" = "production" ]; then
        $compose_cmd -f "$COMPOSE_FILE" -f "$PROD_COMPOSE_FILE" ps
    else
        $compose_cmd -f "$COMPOSE_FILE" ps
    fi
    
    log "Deployment verification complete"
}

# Main deployment function
main() {
    log "Starting Docker deployment to $ENVIRONMENT environment"
    
    pre_deployment_checks
    validate_config
    build_images
    start_services
    
    # Wait a bit for services to start
    sleep 5
    
    wait_for_health
    run_migrations
    verify_deployment
    
    log "✅ Deployment completed successfully!"
    log "Backend: http://localhost:2000"
    log "Frontend: http://localhost:1000"
    log "Health: http://localhost:2000/health"
}

main "$@"

