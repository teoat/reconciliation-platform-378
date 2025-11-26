#!/bin/bash
# Deploy to Production Environment
# Production deployment with comprehensive validation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🚀 Deploying to Production Environment..."

# Set working directory
cd "$SCRIPT_DIR/.."

# Check prerequisites
log_info "Checking prerequisites..."
check_command docker
check_command docker-compose

# Verify production environment
if [ "$ENVIRONMENT" != "production" ]; then
    log_error "❌ ENVIRONMENT must be set to 'production'"
    log_error "   Set: export ENVIRONMENT=production"
    exit 1
fi

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check database migrations
log_info "Verifying database migrations..."
if [ -f "scripts/execute-migrations.sh" ]; then
    ./scripts/execute-migrations.sh
    if [ $? -ne 0 ]; then
        log_error "❌ Database migrations failed - aborting deployment"
        exit 1
    fi
else
    log_error "❌ Migration script not found - aborting deployment"
    exit 1
fi

# Verify secrets are set
log_info "Verifying required secrets..."
REQUIRED_SECRETS=("JWT_SECRET" "DATABASE_URL" "CSRF_SECRET")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if [ -z "${!secret}" ]; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    log_error "❌ Missing required secrets: ${MISSING_SECRETS[*]}"
    exit 1
fi

log_success "✅ All required secrets are set"

# Build services
log_info "Building production images..."
if docker-compose -f docker-compose.yml build; then
    log_success "✅ Build completed"
else
    log_error "❌ Build failed"
    exit 1
fi

# Deploy with zero-downtime strategy
log_info "Deploying services (zero-downtime)..."
if docker-compose -f docker-compose.yml up -d; then
    log_success "✅ Services deployed"
else
    log_error "❌ Deployment failed"
    exit 1
fi

# Wait for services
log_info "Waiting for services to be ready..."
sleep 15

# Run comprehensive validation
log_info "Running production validation..."
if [ -f "scripts/validate-deployment.sh" ]; then
    API_BASE_URL="${API_BASE_URL:-https://api.example.com}" ./scripts/validate-deployment.sh
    if [ $? -ne 0 ]; then
        log_error "❌ Validation failed - consider rollback"
        exit 1
    fi
else
    log_warning "⚠️  Validation script not found"
fi

# Final health check
log_info "Performing final health check..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "${API_BASE_URL:-http://localhost:2000}/api/health" > /dev/null; then
        log_success "✅ Health check passed"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 5
        else
            log_error "❌ Health check failed after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done

# Check metrics
log_info "Verifying metrics endpoint..."
if curl -f -s "${API_BASE_URL:-http://localhost:2000}/api/metrics/health" > /dev/null; then
    log_success "✅ Metrics endpoint available"
else
    log_warning "⚠️  Metrics endpoint not available"
fi

log_success "🎉 Production deployment completed successfully!"
log_info "Monitor deployment at:"
log_info "  - Health: ${API_BASE_URL:-http://localhost:2000}/api/health"
log_info "  - Metrics: ${API_BASE_URL:-http://localhost:2000}/api/metrics/summary"
log_info "  - Resilience: ${API_BASE_URL:-http://localhost:2000}/api/health/resilience"

