#!/bin/bash
# ==============================================================================
# Quick Start Docker Deployment
# ==============================================================================
# Simple script to start Docker and deploy all services
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "DOCKER QUICK START - Reconciliation Platform"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==============================================================================
# STEP 1: Check Docker
# ==============================================================================
log_info "Step 1: Checking Docker installation..."

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    log_info "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi
log_success "Docker is installed"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    log_warning "Docker daemon is not running"
    log_info "Attempting to start Docker Desktop..."
    
    # Try to start Docker Desktop (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if open -a Docker 2>/dev/null; then
            log_info "Docker Desktop is starting... Please wait 30 seconds"
            log_info "Waiting for Docker to be ready..."
            
            # Wait for Docker to start (max 60 seconds)
            for i in {1..60}; do
                if docker info &> /dev/null; then
                    log_success "Docker is now running"
                    break
                fi
                if [ $i -eq 60 ]; then
                    log_error "Docker did not start within 60 seconds"
                    log_info "Please start Docker Desktop manually and try again"
                    exit 1
                fi
                sleep 1
            done
        else
            log_error "Could not start Docker Desktop automatically"
            log_info "Please start Docker Desktop manually and try again"
            exit 1
        fi
    else
        log_error "Please start Docker manually"
        log_info "Linux: sudo systemctl start docker"
        log_info "Windows: Start Docker Desktop from Start Menu"
        exit 1
    fi
else
    log_success "Docker daemon is running"
fi

echo ""

# ==============================================================================
# STEP 2: Check Docker Compose
# ==============================================================================
log_info "Step 2: Checking Docker Compose..."

if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    log_success "Using docker-compose command"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    log_success "Using docker compose command"
else
    log_error "Docker Compose is not available"
    exit 1
fi

echo ""

# ==============================================================================
# STEP 3: Create Docker Network
# ==============================================================================
log_info "Step 3: Ensuring Docker network exists..."

if ! docker network inspect reconciliation-network &> /dev/null; then
    log_info "Creating reconciliation-network..."
    if docker network create reconciliation-network; then
        log_success "Network created"
    else
        log_error "Failed to create network"
        exit 1
    fi
else
    log_info "Network already exists"
fi

echo ""

# ==============================================================================
# STEP 4: Stop Existing Services (Optional)
# ==============================================================================
log_info "Step 4: Stopping any existing services..."

if $COMPOSE_CMD -f "$COMPOSE_FILE" ps -q 2>/dev/null | grep -q .; then
    log_info "Stopping existing containers..."
    $COMPOSE_CMD -f "$COMPOSE_FILE" down 2>&1 || true
    log_success "Existing services stopped"
else
    log_info "No existing services to stop"
fi

echo ""

# ==============================================================================
# STEP 5: Build Images
# ==============================================================================
log_info "Step 5: Building Docker images..."
log_info "This may take several minutes on first run..."

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

if $COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel; then
    log_success "Images built successfully"
else
    log_error "Image build failed"
    log_info "You can skip building and use existing images with: --no-build"
    exit 1
fi

echo ""

# ==============================================================================
# STEP 6: Start Services
# ==============================================================================
log_info "Step 6: Starting all services..."

if $COMPOSE_CMD -f "$COMPOSE_FILE" up -d; then
    log_success "Services started"
else
    log_error "Failed to start services"
    exit 1
fi

echo ""

# ==============================================================================
# STEP 7: Wait for Services
# ==============================================================================
log_info "Step 7: Waiting for services to initialize..."
log_info "This may take 2-5 minutes..."

sleep 10

# Show initial status
log_info "Service Status:"
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

echo ""
log_info "Waiting for services to become healthy..."
log_info "You can monitor progress with: docker compose ps"

# Wait for critical services
log_info "Waiting for PostgreSQL..."
for i in {1..30}; do
    if docker exec reconciliation-postgres pg_isready -U postgres &> /dev/null 2>&1; then
        log_success "PostgreSQL is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warning "PostgreSQL health check timeout (may still be starting)"
    else
        sleep 2
    fi
done

log_info "Waiting for Redis..."
for i in {1..30}; do
    if docker exec reconciliation-redis redis-cli -a "${REDIS_PASSWORD:-redis_pass}" ping &> /dev/null 2>&1; then
        log_success "Redis is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        log_warning "Redis health check timeout (may still be starting)"
    else
        sleep 2
    fi
done

echo ""

# ==============================================================================
# STEP 8: Final Status
# ==============================================================================
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "DEPLOYMENT COMPLETE"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_info "Service URLs:"
echo "  Frontend:      http://localhost:1000"
echo "  Backend API:   http://localhost:2000"
echo "  PostgreSQL:    localhost:5432"
echo "  Redis:         localhost:6379"
echo "  Prometheus:    http://localhost:9090"
echo "  Grafana:       http://localhost:3001 (admin/${GRAFANA_PASSWORD:-admin})"
echo "  Elasticsearch: http://localhost:9200"
echo "  Kibana:        http://localhost:5601"
echo "  APM Server:    http://localhost:8200"
echo ""

log_info "Useful Commands:"
echo "  View logs:        docker compose logs -f [service-name]"
echo "  Check status:     docker compose ps"
echo "  Stop services:     docker compose down"
echo "  Restart service:  docker compose restart [service-name]"
echo "  View all logs:    docker compose logs -f"
echo ""

log_info "Health Checks:"
echo "  Backend:  curl http://localhost:2000/api/health"
echo "  Frontend: curl http://localhost:1000/health"
echo ""

log_success "All services are starting. Some services may take a few more minutes to be fully ready."
log_info "Monitor with: docker compose ps"

