#!/bin/bash
# Deploy Better Auth to Production
# Handles complete deployment of auth server, frontend, and backend

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Configuration
ENVIRONMENT="${1:-staging}"
SKIP_MIGRATIONS="${SKIP_MIGRATIONS:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"

log_info "🚀 Better Auth Deployment Script"
log_info "Environment: $ENVIRONMENT"
echo ""

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    log_error "Invalid environment. Use: staging or production"
    exit 1
fi

# Check prerequisites
check_command "docker" "Docker is required"
check_command "docker-compose" "Docker Compose is required"
check_command "psql" "PostgreSQL client is required"

# Step 1: Run database migrations
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    log_info "Step 1: Running database migrations..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable not set"
        exit 1
    fi
    
    psql "$DATABASE_URL" < "$PROJECT_ROOT/scripts/migrate-users-to-better-auth.sql" || {
        log_error "User migration failed"
        exit 1
    }
    
    cd "$PROJECT_ROOT/auth-server"
    npm run db:migrate || {
        log_error "Auth server migrations failed"
        exit 1
    }
    
    log_success "✅ Database migrations completed"
else
    log_warning "Skipping database migrations (SKIP_MIGRATIONS=true)"
fi

# Step 2: Build Docker images
log_info "Step 2: Building Docker images..."

cd "$PROJECT_ROOT"

# Build auth server
docker build -f docker/auth-server.dockerfile -t auth-server:$ENVIRONMENT . || {
    log_error "Failed to build auth server image"
    exit 1
}

log_success "✅ Docker images built"

# Step 3: Run tests
if [ "$SKIP_TESTS" != "true" ]; then
    log_info "Step 3: Running integration tests..."
    
    # Start services for testing
    docker-compose -f docker-compose.better-auth.yml up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 10
    
    # Run automated tests
    bash "$SCRIPT_DIR/test-better-auth.sh" || {
        log_error "Integration tests failed"
        docker-compose -f docker-compose.better-auth.yml down
        exit 1
    }
    
    log_success "✅ Integration tests passed"
    
    # Stop test services
    docker-compose -f docker-compose.better-auth.yml down
else
    log_warning "Skipping tests (SKIP_TESTS=true)"
fi

# Step 4: Deploy to environment
log_info "Step 4: Deploying to $ENVIRONMENT..."

if [ "$ENVIRONMENT" = "staging" ]; then
    # Deploy to staging
    docker-compose -f docker-compose.better-auth.yml up -d auth-server
    
    log_success "✅ Deployed to staging"
    log_info "Auth Server: http://localhost:4000"
    log_info "Health Check: http://localhost:4000/health"
    
elif [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    log_warning "Production deployment requires additional steps:"
    echo "1. Update production environment variables"
    echo "2. Run: docker-compose -f docker-compose.better-auth.yml -f docker-compose.production.yml up -d"
    echo "3. Monitor logs: docker-compose logs -f auth-server"
    echo "4. Verify health: curl https://auth.your-domain.com/health"
    
    read -p "Continue with production deployment? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_warning "Production deployment cancelled"
        exit 0
    fi
    
    # Deploy to production
    docker-compose -f docker-compose.better-auth.yml up -d auth-server
    
    log_success "✅ Deployed to production"
    log_warning "Monitor the deployment closely for the next 24 hours"
fi

# Step 5: Verify deployment
log_info "Step 5: Verifying deployment..."

sleep 5

# Check health endpoint
health_check "$AUTH_SERVER_URL/health" 5 || {
    log_error "Health check failed"
    exit 1
}

log_success "✅ Deployment verified"

# Summary
echo ""
echo "======================================"
echo "Deployment Summary"
echo "======================================"
log_info "Environment: $ENVIRONMENT"
log_info "Auth Server: $AUTH_SERVER_URL"
log_success "Status: Deployed and Healthy"
echo ""
log_info "Next steps:"
echo "1. Monitor logs: docker-compose logs -f auth-server"
echo "2. Run integration tests: bash scripts/test-better-auth.sh"
echo "3. Update frontend VITE_AUTH_SERVER_URL"
echo "4. Update backend BETTER_AUTH_SERVER_URL"
echo "5. Set BETTER_AUTH_ENABLED=true when ready"
echo ""
log_success "🎉 Better Auth deployment complete!"

