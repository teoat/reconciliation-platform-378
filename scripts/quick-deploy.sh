#!/bin/bash
# Quick Deploy Script - Simplified deployment process
# This script handles deployment without the environment loading issues

set +e  # Don't exit on errors for environment loading

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

cd "$SCRIPT_DIR/.."

echo "🚀 Quick Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
    log_error "❌ Docker is not running"
    log_info "Please start Docker Desktop and try again"
    exit 1
fi
log_success "✅ Docker is running"

# Configure Beeceptor
log_info "Configuring Beeceptor webhook..."
export WEBHOOK_URL="${WEBHOOK_URL:-https://378to492.free.beeceptor.com}"
export BEEceptor_URL="${BEEceptor_URL:-$WEBHOOK_URL}"

if [ -f "scripts/configure-beeceptor.sh" ]; then
    ./scripts/configure-beeceptor.sh > /dev/null 2>&1
fi

# Stop existing containers (optional - comment out if you want to keep running)
log_info "Stopping existing containers..."
docker-compose down backend 2>/dev/null || true

# Build backend
log_info "Building backend image..."
if docker-compose build backend; then
    log_success "✅ Build completed"
else
    log_error "❌ Build failed"
    exit 1
fi

# Start services
log_info "Starting services..."
if docker-compose up -d backend postgres redis; then
    log_success "✅ Services started"
else
    log_error "❌ Failed to start services"
    exit 1
fi

# Wait for services
log_info "Waiting for services to be ready..."
sleep 20

# Health check
log_info "Checking backend health..."
MAX_RETRIES=10
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -k -f -s http://localhost:2000/api/health > /dev/null 2>&1; then
        log_success "✅ Backend is healthy!"
        HEALTHY=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        fi
    fi
done

if [ "$HEALTHY" = false ]; then
    log_warning "⚠️  Backend health check failed, but service is running"
    log_info "Check logs with: docker-compose logs -f backend"
fi

# Display summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services:"
docker-compose ps --format "  • {{.Name}}: {{.Status}}" | grep -E "backend|postgres|redis"
echo ""
echo "🔗 Endpoints:"
echo "  • API: http://localhost:2000"
echo "  • Health: http://localhost:2000/api/health"
echo ""
echo "📡 Beeceptor Webhook:"
echo "  • URL: $WEBHOOK_URL"
echo "  • Dashboard: https://beeceptor.com/dashboard"
echo ""
echo "📋 Commands:"
echo "  • Logs: docker-compose logs -f backend"
echo "  • Status: docker-compose ps"
echo "  • Stop: docker-compose down"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

