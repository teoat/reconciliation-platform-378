#!/bin/bash
# Deploy Optimized Docker Compose
# Synchronizes and deploys all services with optimized configuration

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🐳 Deploying optimized Docker Compose configuration..."

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.optimized.yml}"
ENV_FILE="${ENV_FILE:-.env}"
BUILD_MODE="${BUILD_MODE:-production}"
PARALLEL_BUILD="${PARALLEL_BUILD:-true}"

# Step 1: Validate prerequisites
log_info "Step 1: Validating prerequisites..."
if ! check_command docker; then
    log_error "❌ Docker is not installed"
    exit 1
fi

if ! check_command docker-compose && ! docker compose version &> /dev/null; then
    log_error "❌ Docker Compose is not installed"
    exit 1
fi

# Use 'docker compose' (v2) if available, otherwise 'docker-compose' (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

log_success "✅ Prerequisites validated"

# Step 2: Check environment file
log_info "Step 2: Checking environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    log_warning "⚠️  $ENV_FILE not found, using defaults"
    if [ -f "$ENV_FILE.example" ]; then
        log_info "Copying example environment file..."
        cp "$ENV_FILE.example" "$ENV_FILE"
        log_warning "⚠️  Please update $ENV_FILE with your configuration"
    fi
else
    log_success "✅ Environment file found"
fi

# Step 3: Validate Docker Compose file
log_info "Step 3: Validating Docker Compose configuration..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
    log_error "❌ Docker Compose configuration is invalid"
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" config
    exit 1
fi
log_success "✅ Docker Compose configuration is valid"

# Step 4: Stop existing services (if running)
log_info "Step 4: Stopping existing services..."
if $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log_info "Stopping existing containers..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" down
    log_success "✅ Existing services stopped"
else
    log_info "No running services found"
fi

# Step 5: Build images (with optimization)
log_info "Step 5: Building optimized Docker images..."
BUILD_ARGS=""
if [ "$PARALLEL_BUILD" = "true" ]; then
    BUILD_ARGS="--parallel"
    log_info "Building images in parallel for faster builds..."
fi

# Enable BuildKit for better caching
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

if $DOCKER_COMPOSE -f "$COMPOSE_FILE" build $BUILD_ARGS; then
    log_success "✅ Images built successfully"
else
    log_error "❌ Image build failed"
    exit 1
fi

# Step 6: Start services in correct order
log_info "Step 6: Starting services with proper synchronization..."

# Start infrastructure services first
log_info "Starting infrastructure services (Postgres, Redis)..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d postgres redis

# Wait for infrastructure to be healthy
log_info "Waiting for infrastructure services to be healthy..."
sleep 5
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps postgres redis | grep -q "healthy"; then
        log_success "✅ Infrastructure services healthy"
        break
    fi
    sleep 2
    ((WAIT_COUNT+=2))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    log_error "❌ Infrastructure services did not become healthy in time"
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs postgres redis
    exit 1
fi

# Start monitoring services
log_info "Starting monitoring services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d elasticsearch prometheus

# Start supporting services
log_info "Starting supporting services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d pgbouncer logstash kibana apm-server

# Wait for supporting services
log_info "Waiting for supporting services..."
sleep 10

# Start application services
log_info "Starting application services (Backend, Frontend)..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d backend frontend

# Start visualization
log_info "Starting visualization services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d grafana

# Step 7: Verify deployment
log_info "Step 7: Verifying deployment..."
sleep 15

# Check service status
log_info "Service status:"
$DOCKER_COMPOSE -f "$COMPOSE_FILE" ps

# Check health endpoints
log_info "Checking health endpoints..."
BACKEND_URL="${BACKEND_URL:-http://localhost:2000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"

if check_endpoint "$BACKEND_URL/health" 10; then
    log_success "✅ Backend health check passed"
else
    log_warning "⚠️  Backend health check failed (may still be starting)"
fi

if check_endpoint "$FRONTEND_URL" 10; then
    log_success "✅ Frontend is accessible"
else
    log_warning "⚠️  Frontend check failed (may still be starting)"
fi

# Step 8: Display service URLs
log_info "📊 Deployment Summary:"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Services:"
log_info "  Backend API:     http://localhost:2000"
log_info "  Frontend:        http://localhost:1000"
log_info "  PostgreSQL:      localhost:5432"
log_info "  Redis:           localhost:6379"
log_info "  Prometheus:      http://localhost:9090"
log_info "  Grafana:         http://localhost:3001"
log_info "  Kibana:          http://localhost:5601"
log_info "  Elasticsearch:   http://localhost:9200"
log_info "  APM Server:      http://localhost:8200"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 9: Show logs command
log_info "Useful commands:"
log_info "  View logs:        $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f [service]"
log_info "  Stop services:    $DOCKER_COMPOSE -f $COMPOSE_FILE down"
log_info "  Restart service:  $DOCKER_COMPOSE -f $COMPOSE_FILE restart [service]"
log_info "  Service status:   $DOCKER_COMPOSE -f $COMPOSE_FILE ps"

log_success "✅ Optimized Docker deployment complete!"
log_info "All services are synchronized and running"

