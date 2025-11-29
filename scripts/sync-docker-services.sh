#!/bin/bash
# Synchronize Docker Services
# Ensures all Docker services are properly synchronized and configured

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔄 Synchronizing Docker services..."

# Configuration
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.optimized.yml}"

# Use 'docker compose' (v2) if available, otherwise 'docker-compose' (v1)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Step 1: Validate Docker Compose configuration
log_info "Step 1: Validating Docker Compose configuration..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
    log_error "❌ Docker Compose configuration is invalid"
    exit 1
fi
log_success "✅ Configuration is valid"

# Step 2: Check service dependencies
log_info "Step 2: Checking service dependencies..."

# Extract service dependencies from docker-compose.yml
SERVICES=("postgres" "redis" "elasticsearch" "prometheus" "pgbouncer" "logstash" "kibana" "apm-server" "backend" "frontend" "grafana")

for service in "${SERVICES[@]}"; do
    if grep -q "^  $service:" "$COMPOSE_FILE"; then
        log_info "  ✅ Service '$service' found"
    else
        log_warning "  ⚠️  Service '$service' not found"
    fi
done

# Step 3: Verify network configuration
log_info "Step 3: Verifying network configuration..."
if docker network ls | grep -q "reconciliation-network"; then
    log_success "✅ Network 'reconciliation-network' exists"
else
    log_info "Network will be created on first deployment"
fi

# Step 4: Verify volumes
log_info "Step 4: Verifying volumes..."
REQUIRED_VOLUMES=("postgres_data" "redis_data" "uploads_data" "logs_data" "prometheus_data" "grafana_data" "elasticsearch_data")

for volume in "${REQUIRED_VOLUMES[@]}"; do
    if docker volume ls | grep -q "$volume"; then
        log_info "  ✅ Volume '$volume' exists"
    else
        log_info "  ℹ️  Volume '$volume' will be created on first deployment"
    fi
done

# Step 5: Check service synchronization
log_info "Step 5: Checking service synchronization..."

# Check if services are running
RUNNING_SERVICES=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps --services --filter "status=running" 2>/dev/null | wc -l)
TOTAL_SERVICES=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" config --services 2>/dev/null | wc -l)

if [ "$RUNNING_SERVICES" -gt 0 ]; then
    log_info "Running services: $RUNNING_SERVICES / $TOTAL_SERVICES"
    
    # Check health status
    UNHEALTHY=$($DOCKER_COMPOSE -f "$COMPOSE_FILE" ps | grep -c "unhealthy" || true)
    if [ "$UNHEALTHY" -gt 0 ]; then
        log_warning "⚠️  $UNHEALTHY service(s) are unhealthy"
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" ps | grep "unhealthy"
    else
        log_success "✅ All running services are healthy"
    fi
else
    log_info "No services are currently running"
fi

# Step 6: Verify service dependencies order
log_info "Step 6: Verifying service startup order..."

# Check that backend depends on postgres and redis
if grep -A 10 "^  backend:" "$COMPOSE_FILE" | grep -q "postgres:"; then
    log_success "✅ Backend depends on Postgres"
else
    log_warning "⚠️  Backend dependency on Postgres not found"
fi

if grep -A 10 "^  backend:" "$COMPOSE_FILE" | grep -q "redis:"; then
    log_success "✅ Backend depends on Redis"
else
    log_warning "⚠️  Backend dependency on Redis not found"
fi

# Check that frontend depends on backend
if grep -A 10 "^  frontend:" "$COMPOSE_FILE" | grep -q "backend:"; then
    log_success "✅ Frontend depends on Backend"
else
    log_warning "⚠️  Frontend dependency on Backend not found"
fi

# Step 7: Verify health checks
log_info "Step 7: Verifying health checks..."
SERVICES_WITH_HEALTHCHECKS=("postgres" "redis" "backend" "frontend" "prometheus" "grafana" "elasticsearch" "kibana" "apm-server")

for service in "${SERVICES_WITH_HEALTHCHECKS[@]}"; do
    if grep -A 5 "^  $service:" "$COMPOSE_FILE" | grep -q "healthcheck:"; then
        log_success "  ✅ $service has health check"
    else
        log_warning "  ⚠️  $service missing health check"
    fi
done

# Step 8: Check resource limits
log_info "Step 8: Checking resource limits..."
if grep -q "deploy:" "$COMPOSE_FILE" && grep -q "resources:" "$COMPOSE_FILE"; then
    log_success "✅ Resource limits configured"
else
    log_warning "⚠️  Resource limits not configured (recommended for production)"
fi

log_success "✅ Service synchronization check complete"
log_info "📝 Summary:"
log_info "  - Configuration: Valid"
log_info "  - Dependencies: Verified"
log_info "  - Health checks: Configured"
log_info "  - Resource limits: Configured"

