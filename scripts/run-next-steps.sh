#!/bin/bash
# ==============================================================================
# Run Next Steps Script
# ==============================================================================
# Executes the next steps after environment setup:
# 1. Verify environment
# 2. Run pending migrations
# 3. Start services
# 4. Verify all services
# Usage: ./scripts/run-next-steps.sh [skip-migrations|skip-start]
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

SKIP_MIGRATIONS="${1:-}"
SKIP_START="${2:-}"

log_info "=== Running Next Steps ==="
echo ""

# ==============================================================================
# STEP 1: Verify Environment
# ==============================================================================

log_info "=== Step 1: Verifying Environment ==="

# Check .env file
if [ ! -f "$ENV_FILE" ]; then
    log_error ".env file not found. Run ./scripts/setup-environment.sh first"
    exit 1
fi
log_success ".env file exists"

# Load environment variables
export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)

# Verify required variables
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL not set in .env file"
    exit 1
fi
log_success "DATABASE_URL is set"

if [ -z "$JWT_SECRET" ]; then
    log_error "JWT_SECRET not set in .env file"
    exit 1
fi
log_success "JWT_SECRET is set"

# Check Docker
if ! check_docker; then
    log_error "Docker is not running"
    exit 1
fi

# Check database container
if ! docker ps --format '{{.Names}}' | grep -q "^reconciliation-postgres$"; then
    log_warning "PostgreSQL container not running. Starting..."
    cd "$PROJECT_ROOT"
    docker-compose up -d postgres redis
    log_info "Waiting for services to start..."
    sleep 10
fi

# Test database connection
if docker exec reconciliation-postgres pg_isready -U postgres > /dev/null 2>&1; then
    log_success "PostgreSQL is ready"
else
    log_error "PostgreSQL is not ready"
    exit 1
fi

echo ""

# ==============================================================================
# STEP 2: Run Migrations (if not skipped)
# ==============================================================================

if [ "$SKIP_MIGRATIONS" != "skip-migrations" ]; then
    log_info "=== Step 2: Running Database Migrations ==="
    
    cd "$PROJECT_ROOT"
    
    if [ -f "scripts/execute-migrations.sh" ]; then
        log_info "Executing migrations..."
        if ./scripts/execute-migrations.sh 2>&1 | grep -q "Migration failed"; then
            log_warning "Some migrations encountered issues (tables may already exist)"
        else
            log_success "Migrations completed"
        fi
    else
        log_warning "Migration script not found, skipping"
    fi
    
    echo ""
else
    log_info "=== Step 2: Skipping Migrations ==="
    echo ""
fi

# ==============================================================================
# STEP 3: Start Services (if not skipped)
# ==============================================================================

if [ "$SKIP_START" != "skip-start" ]; then
    log_info "=== Step 3: Starting Services ==="
    
    cd "$PROJECT_ROOT"
    
    # Check if services are already running
    BACKEND_RUNNING=$(docker ps --format '{{.Names}}' | grep -c "^reconciliation-backend" || true)
    FRONTEND_RUNNING=$(docker ps --format '{{.Names}}' | grep -c "^reconciliation-frontend" || true)
    
    if [ "$BACKEND_RUNNING" -eq 0 ] || [ "$FRONTEND_RUNNING" -eq 0 ]; then
        log_info "Starting services with docker-compose..."
        docker-compose up -d backend frontend
        
        log_info "Waiting for services to start..."
        sleep 15
        
        # Check backend health
        if curl -f http://localhost:2000/api/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
        else
            log_warning "Backend may still be starting (check logs: docker-compose logs backend)"
        fi
        
        # Check frontend
        if curl -f http://localhost:1000 > /dev/null 2>&1; then
            log_success "Frontend is accessible"
        else
            log_warning "Frontend may still be starting (check logs: docker-compose logs frontend)"
        fi
    else
        log_info "Services are already running"
    fi
    
    echo ""
else
    log_info "=== Step 3: Skipping Service Start ==="
    echo ""
fi

# ==============================================================================
# STEP 4: Verify Services
# ==============================================================================

log_info "=== Step 4: Verifying Services ==="

# Verify database
if docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -c "SELECT 1;" > /dev/null 2>&1; then
    log_success "Database connection verified"
else
    log_error "Database connection failed"
fi

# Verify Redis
if docker exec reconciliation-redis redis-cli -a redis_pass ping > /dev/null 2>&1; then
    log_success "Redis connection verified"
else
    log_warning "Redis connection test failed"
fi

# Verify backend (if running)
if docker ps --format '{{.Names}}' | grep -q "^reconciliation-backend"; then
    if curl -f http://localhost:2000/api/health > /dev/null 2>&1; then
        log_success "Backend API is healthy"
    else
        log_warning "Backend API health check failed"
    fi
fi

# Verify frontend (if running)
if docker ps --format '{{.Names}}' | grep -q "^reconciliation-frontend"; then
    if curl -f http://localhost:1000 > /dev/null 2>&1; then
        log_success "Frontend is accessible"
    else
        log_warning "Frontend accessibility check failed"
    fi
fi

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================

log_success "=== Next Steps Complete ==="
echo ""
log_info "Services Status:"
echo "  - PostgreSQL: $(docker ps --format '{{.Status}}' --filter name=reconciliation-postgres | head -1 || echo 'Not running')"
echo "  - Redis: $(docker ps --format '{{.Status}}' --filter name=reconciliation-redis | head -1 || echo 'Not running')"
echo "  - Backend: $(docker ps --format '{{.Status}}' --filter name=reconciliation-backend | head -1 || echo 'Not running')"
echo "  - Frontend: $(docker ps --format '{{.Status}}' --filter name=reconciliation-frontend | head -1 || echo 'Not running')"
echo ""
log_info "Access URLs:"
echo "  - Backend API: http://localhost:2000"
echo "  - Backend Health: http://localhost:2000/api/health"
echo "  - Frontend: http://localhost:1000"
echo "  - Swagger Docs: http://localhost:2000/api/docs"
echo ""
log_info "Useful Commands:"
echo "  - View logs: docker-compose logs -f [service]"
echo "  - Stop services: docker-compose stop"
echo "  - Restart services: docker-compose restart [service]"
echo "  - Verify all: ./scripts/verify-all-services.sh dev http://localhost:2000"
echo ""
log_info "Next Actions:"
echo "  1. Test API: curl http://localhost:2000/api/health"
echo "  2. Open frontend: http://localhost:1000"
echo "  3. Run tests: ./scripts/run-all-tests.sh"
echo "  4. Begin Phase 1: Follow docs/project-management/PHASED_IMPLEMENTATION_PLAN.md"

