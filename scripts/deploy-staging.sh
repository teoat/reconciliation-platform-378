#!/bin/bash
# Deploy to Staging Environment
# Validates deployment and runs health checks

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🚀 Deploying to Staging Environment..."

# Set working directory
cd "$SCRIPT_DIR/.."

# Check prerequisites
log_info "Checking prerequisites..."
check_command docker
check_command docker-compose

# Set environment
export ENVIRONMENT=staging
export NODE_ENV=production

# Run database migrations
log_info "Running database migrations..."
if [ -f "scripts/execute-migrations.sh" ]; then
    ./scripts/execute-migrations.sh
else
    log_warning "Migration script not found, skipping migrations"
fi

# Build and start services
log_info "Building and starting services..."
if docker-compose -f docker-compose.staging.yml up -d --build; then
    log_success "✅ Services started successfully"
else
    log_error "❌ Failed to start services"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 10

# Run deployment validation
log_info "Running deployment validation..."
if [ -f "scripts/validate-deployment.sh" ]; then
    API_BASE_URL="http://localhost:2000" ./scripts/validate-deployment.sh
else
    log_warning "Validation script not found, skipping validation"
fi

# Health check
log_info "Performing health check..."
if curl -f -s http://localhost:2000/api/health > /dev/null; then
    log_success "✅ Health check passed"
else
    log_error "❌ Health check failed"
    exit 1
fi

# Check metrics endpoint
log_info "Checking metrics endpoint..."
if curl -f -s http://localhost:2000/api/metrics/health > /dev/null; then
    log_success "✅ Metrics endpoint available"
else
    log_warning "⚠️  Metrics endpoint not available"
fi

log_success "🎉 Staging deployment completed successfully!"
log_info "Services available at:"
log_info "  - API: http://localhost:2000"
log_info "  - Health: http://localhost:2000/api/health"
log_info "  - Metrics: http://localhost:2000/api/metrics/summary"
