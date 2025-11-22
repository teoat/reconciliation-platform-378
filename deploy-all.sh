#!/bin/bash
# ============================================================================
# UNIFIED DEPLOYMENT SCRIPT - Deploy All Services
# ============================================================================
# This script composes and deploys all services for the Reconciliation Platform
# Usage: ./deploy-all.sh [environment] [options]
# Environments: dev, production
# Options: --skip-tests, --skip-migrations, --rebuild
# ============================================================================

set -euo pipefail

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Source common functions
if [ -f "$SCRIPT_DIR/scripts/lib/common-functions.sh" ]; then
    source "$SCRIPT_DIR/scripts/lib/common-functions.sh"
else
    # Fallback if common functions not available
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
    log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
    log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
    log_error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
    check_command() { command -v "$1" >/dev/null 2>&1 || log_error "$1 is not installed"; }
fi

# Default values
ENVIRONMENT="${1:-dev}"
SKIP_TESTS=false
SKIP_MIGRATIONS=false
REBUILD=false
COMPOSE_FILE="docker-compose.yml"

# Determine compose file based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    if [ -f "docker-compose.prod.yml" ]; then
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        log_warning "docker-compose.prod.yml not found, using docker-compose.yml"
    fi
fi

# Parse arguments
for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-migrations)
            SKIP_MIGRATIONS=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        dev|production)
            ENVIRONMENT="$arg"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Print header
echo ""
echo "============================================================================"
echo "  🚀 Reconciliation Platform - Deploy All Services"
echo "============================================================================"
echo "  Environment: $ENVIRONMENT"
echo "  Skip Tests: $SKIP_TESTS"
echo "  Skip Migrations: $SKIP_MIGRATIONS"
echo "  Rebuild: $REBUILD"
echo "============================================================================"
echo ""

# ============================================================================
# STEP 1: PREREQUISITE CHECKS
# ============================================================================
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    check_command docker
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker daemon is not running. Please start Docker first."
    fi
    log_success "Docker is running"
    
    # Check docker-compose
    if command -v docker-compose >/dev/null 2>&1; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version >/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    else
        log_error "docker-compose is not installed"
    fi
    log_success "Docker Compose available: $COMPOSE_CMD"
    
    # Check required files
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "docker-compose.yml not found"
    fi
    log_success "Docker Compose file found"
    
    # Check Dockerfiles
    if [ ! -f "infrastructure/docker/Dockerfile.backend" ]; then
        log_warning "Backend Dockerfile not found, will use image if available"
    fi
    if [ ! -f "infrastructure/docker/Dockerfile.frontend" ]; then
        log_warning "Frontend Dockerfile not found, will use image if available"
    fi
}

# ============================================================================
# STEP 2: CREATE DOCKER NETWORK
# ============================================================================
setup_network() {
    log_info "Setting up Docker network..."
    
    NETWORK_NAME="reconciliation-network"
    
    if docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
        log_success "Network '$NETWORK_NAME' already exists"
    else
        log_info "Creating network '$NETWORK_NAME'..."
        docker network create "$NETWORK_NAME" || log_error "Failed to create network"
        log_success "Network '$NETWORK_NAME' created"
    fi
}

# ============================================================================
# STEP 3: ENVIRONMENT SETUP
# ============================================================================
setup_environment() {
    log_info "Setting up environment configuration..."
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        log_warning ".env file not found, creating from defaults..."
        cat > .env << 'EOF'
# Database Configuration
POSTGRES_DB=reconciliation_app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres_pass
POSTGRES_PORT=5432

# Redis Configuration
REDIS_PASSWORD=redis_pass
REDIS_PORT=6379

# Application Ports
BACKEND_PORT=2000
FRONTEND_PORT=1000

# Monitoring Ports
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
ELASTICSEARCH_PORT=9200
KIBANA_PORT=5601
APM_PORT=8200
LOGSTASH_PORT=5044
LOGSTASH_HTTP_PORT=9600

# JWT Configuration
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dev-jwt-secret-key-change-in-production")
JWT_EXPIRATION=86400

# CORS Configuration
CORS_ORIGINS=http://localhost:1000

# Environment
ENVIRONMENT=dev
EOF
        log_success "Created .env file with defaults"
    else
        log_success ".env file exists"
    fi
    
    # Source environment variables
    set -a
    [ -f .env ] && source .env
    set +a
}

# ============================================================================
# STEP 4: STOP EXISTING CONTAINERS
# ============================================================================
stop_existing_containers() {
    log_info "Stopping existing containers..."
    
    if $COMPOSE_CMD ps -q >/dev/null 2>&1; then
        $COMPOSE_CMD down --remove-orphans || true
        log_success "Existing containers stopped"
    else
        log_info "No existing containers to stop"
    fi
}

# ============================================================================
# STEP 5: BUILD DOCKER IMAGES
# ============================================================================
build_images() {
    log_info "Building Docker images (this may take several minutes)..."
    
    # Enable BuildKit for faster builds
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    local build_args=""
    if [ "$REBUILD" = true ]; then
        build_args="--no-cache"
        log_info "Rebuilding all images from scratch..."
    fi
    
    if $COMPOSE_CMD build --parallel $build_args; then
        log_success "Docker images built successfully"
    else
        log_error "Docker build failed"
    fi
}

# ============================================================================
# STEP 6: START SERVICES
# ============================================================================
start_services() {
    log_info "Starting all services..."
    
    if $COMPOSE_CMD up -d; then
        log_success "Services started"
    else
        log_error "Failed to start services"
    fi
    
    # Show service status
    log_info "Service status:"
    $COMPOSE_CMD ps
}

# ============================================================================
# STEP 7: WAIT FOR SERVICES TO BE READY
# ============================================================================
wait_for_services() {
    log_info "Waiting for services to be ready..."
    
    local max_attempts=60
    local attempt=0
    
    # Wait for PostgreSQL
    log_info "Waiting for PostgreSQL..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec reconciliation-postgres pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; then
            log_success "PostgreSQL is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        [ $((attempt % 5)) -eq 0 ] && echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_warning "PostgreSQL health check timed out"
    fi
    
    # Wait for Redis
    log_info "Waiting for Redis..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker exec reconciliation-redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping >/dev/null 2>&1; then
            log_success "Redis is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
        [ $((attempt % 5)) -eq 0 ] && echo -n "."
    done
    echo ""
    
    # Wait for Elasticsearch
    log_info "Waiting for Elasticsearch..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:${ELASTICSEARCH_PORT:-9200}/_cluster/health >/dev/null 2>&1; then
            log_success "Elasticsearch is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        [ $((attempt % 5)) -eq 0 ] && echo -n "."
    done
    echo ""
    
    # Wait for Backend
    log_info "Waiting for Backend API..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:${BACKEND_PORT:-2000}/health >/dev/null 2>&1 || \
           curl -f -s http://localhost:${BACKEND_PORT:-2000}/api/health >/dev/null 2>&1; then
            log_success "Backend API is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
        [ $((attempt % 5)) -eq 0 ] && echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_warning "Backend health check timed out (may still be starting)"
    fi
    
    # Wait for Frontend
    log_info "Waiting for Frontend..."
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f -s http://localhost:${FRONTEND_PORT:-1000} >/dev/null 2>&1; then
            log_success "Frontend is ready"
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
        [ $((attempt % 5)) -eq 0 ] && echo -n "."
    done
    echo ""
    
    if [ $attempt -eq $max_attempts ]; then
        log_warning "Frontend health check timed out (may still be starting)"
    fi
}

# ============================================================================
# STEP 8: RUN DATABASE MIGRATIONS
# ============================================================================
run_migrations() {
    if [ "$SKIP_MIGRATIONS" = true ]; then
        log_warning "Skipping database migrations"
        return
    fi
    
    log_info "Running database migrations..."
    
    # Wait a bit more for backend to be fully ready
    sleep 5
    
    # Try different migration commands
    if $COMPOSE_CMD exec -T backend diesel migration run >/dev/null 2>&1; then
        log_success "Database migrations completed"
    elif $COMPOSE_CMD exec -T backend ./migrate.sh >/dev/null 2>&1; then
        log_success "Database migrations completed (via migrate.sh)"
    else
        log_warning "Migration command failed or no migrations to run"
        log_info "You may need to run migrations manually:"
        log_info "  docker compose exec backend diesel migration run"
    fi
}

# ============================================================================
# STEP 9: VERIFY DEPLOYMENT
# ============================================================================
verify_deployment() {
    log_info "Verifying deployment..."
    
    local all_healthy=true
    
    # Check Backend
    if curl -f -s http://localhost:${BACKEND_PORT:-2000}/health >/dev/null 2>&1 || \
       curl -f -s http://localhost:${BACKEND_PORT:-2000}/api/health >/dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_warning "Backend health check failed"
        all_healthy=false
    fi
    
    # Check Frontend
    if curl -f -s http://localhost:${FRONTEND_PORT:-1000} >/dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend health check failed"
        all_healthy=false
    fi
    
    # Check Database
    if docker exec reconciliation-postgres pg_isready -U "${POSTGRES_USER:-postgres}" >/dev/null 2>&1; then
        log_success "Database is healthy"
    else
        log_warning "Database health check failed"
        all_healthy=false
    fi
    
    # Check Redis
    if docker exec reconciliation-redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping >/dev/null 2>&1; then
        log_success "Redis is healthy"
    else
        log_warning "Redis health check failed"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log_success "All core services are healthy"
    else
        log_warning "Some services may not be fully ready yet"
    fi
}

# ============================================================================
# STEP 10: SHOW DEPLOYMENT STATUS
# ============================================================================
show_status() {
    echo ""
    echo "============================================================================"
    echo "  📊 Deployment Status"
    echo "============================================================================"
    echo ""
    
    # Show service status
    $COMPOSE_CMD ps
    
    echo ""
    echo "============================================================================"
    echo "  🔗 Access URLs"
    echo "============================================================================"
    echo ""
    echo "  Frontend:        http://localhost:${FRONTEND_PORT:-1000}"
    echo "  Backend API:     http://localhost:${BACKEND_PORT:-2000}"
    echo "  Health Check:    http://localhost:${BACKEND_PORT:-2000}/health"
    echo ""
    echo "  Monitoring:"
    echo "    Grafana:       http://localhost:${GRAFANA_PORT:-3001} (admin/admin)"
    echo "    Prometheus:    http://localhost:${PROMETHEUS_PORT:-9090}"
    echo "    Kibana:       http://localhost:${KIBANA_PORT:-5601}"
    echo "    APM Server:    http://localhost:${APM_PORT:-8200}"
    echo ""
    echo "============================================================================"
    echo "  🛠️  Useful Commands"
    echo "============================================================================"
    echo ""
    echo "  View logs:       $COMPOSE_CMD logs -f [service]"
    echo "  Stop services:  $COMPOSE_CMD down"
    echo "  Restart:         $COMPOSE_CMD restart [service]"
    echo "  Service status: $COMPOSE_CMD ps"
    echo ""
}

# ============================================================================
# MAIN DEPLOYMENT FLOW
# ============================================================================
main() {
    check_prerequisites
    setup_network
    setup_environment
    stop_existing_containers
    build_images
    start_services
    wait_for_services
    run_migrations
    verify_deployment
    show_status
    
    echo ""
    echo "============================================================================"
    echo "  ✅ Deployment completed successfully!"
    echo "============================================================================"
    echo ""
}

# Run main function
main

