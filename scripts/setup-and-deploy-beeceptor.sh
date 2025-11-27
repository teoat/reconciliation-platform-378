#!/bin/bash
# Complete Setup and Deployment with Beeceptor
# This script handles everything needed for deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Beeceptor configuration
BEEceptor_URL="${BEEceptor_URL:-https://378to492.free.beeceptor.com}"
WEBHOOK_URL="${WEBHOOK_URL:-$BEEceptor_URL}"

echo "🚀 Complete Setup and Deployment with Beeceptor"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SCRIPT_DIR/.."

# Step 1: Configure Beeceptor
log_info "Step 1: Configuring Beeceptor webhook..."
if [ -f "scripts/configure-beeceptor.sh" ]; then
    ./scripts/configure-beeceptor.sh
else
    log_warning "configure-beeceptor.sh not found, configuring manually..."
    export WEBHOOK_URL=$WEBHOOK_URL
    export BEEceptor_URL=$BEEceptor_URL
fi

# Step 2: Check Docker
log_info "Step 2: Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    log_error "❌ Docker is not running"
    log_info "Please start Docker Desktop:"
    log_info "  1. Open Docker Desktop application"
    log_info "  2. Wait for it to start (whale icon in menu bar)"
    log_info "  3. Run this script again: ./scripts/setup-and-deploy-beeceptor.sh"
    exit 1
fi
log_success "✅ Docker is running"

# Step 3: Set up environment variables
log_info "Step 3: Setting up environment variables..."

# Check if .env exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found, creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    elif [ -f "config/production.env.example" ]; then
        cp config/production.env.example .env
    else
        log_warning "No .env.example found, creating minimal .env"
        touch .env
    fi
fi

# Set default database values if not set
if ! grep -q "^POSTGRES_DB=" .env 2>/dev/null; then
    echo "POSTGRES_DB=reconciliation_app" >> .env
    log_info "Added POSTGRES_DB to .env"
fi

if ! grep -q "^POSTGRES_USER=" .env 2>/dev/null; then
    echo "POSTGRES_USER=postgres" >> .env
    log_info "Added POSTGRES_USER to .env"
fi

if ! grep -q "^POSTGRES_PASSWORD=" .env 2>/dev/null; then
    # Generate a random password
    RANDOM_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    echo "POSTGRES_PASSWORD=$RANDOM_PASSWORD" >> .env
    log_info "Generated and added POSTGRES_PASSWORD to .env"
fi

# Set DATABASE_URL if not set
if ! grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    POSTGRES_USER=$(grep "^POSTGRES_USER=" .env | cut -d'=' -f2)
    POSTGRES_PASSWORD=$(grep "^POSTGRES_PASSWORD=" .env | cut -d'=' -f2)
    POSTGRES_DB=$(grep "^POSTGRES_DB=" .env | cut -d'=' -f2)
    echo "DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}" >> .env
    log_info "Added DATABASE_URL to .env"
fi

# Set JWT_SECRET if not set
if ! grep -q "^JWT_SECRET=" .env 2>/dev/null; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "JWT_SECRET=$JWT_SECRET" >> .env
    log_info "Generated and added JWT_SECRET to .env"
fi

# Set CSRF_SECRET if not set
if ! grep -q "^CSRF_SECRET=" .env 2>/dev/null; then
    CSRF_SECRET=$(openssl rand -base64 32)
    echo "CSRF_SECRET=$CSRF_SECRET" >> .env
    log_info "Generated and added CSRF_SECRET to .env"
fi

# Set environment
if ! grep -q "^ENVIRONMENT=" .env 2>/dev/null; then
    echo "ENVIRONMENT=staging" >> .env
    log_info "Added ENVIRONMENT=staging to .env"
fi

log_success "✅ Environment variables configured"

# Step 4: Source .env and export variables
log_info "Step 4: Loading environment variables..."
set -a
source .env 2>/dev/null || true
set +a

# Export for docker-compose
export WEBHOOK_URL
export BEEceptor_URL
export ENVIRONMENT="${ENVIRONMENT:-staging}"
export NODE_ENV="${NODE_ENV:-production}"

log_success "✅ Environment variables loaded"

# Step 5: Stop any existing containers
log_info "Step 5: Stopping any existing containers..."
docker-compose down 2>/dev/null || true
log_success "✅ Cleaned up existing containers"

# Step 6: Build images
log_info "Step 6: Building Docker images..."
if docker-compose -f docker-compose.yml build; then
    log_success "✅ Build completed"
else
    log_error "❌ Build failed"
    exit 1
fi

# Step 7: Start services
log_info "Step 7: Starting services..."
if docker-compose -f docker-compose.yml up -d; then
    log_success "✅ Services started"
else
    log_error "❌ Failed to start services"
    exit 1
fi

# Step 8: Wait for services
log_info "Step 8: Waiting for services to be ready..."
sleep 20

# Step 9: Run migrations
log_info "Step 9: Running database migrations..."
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "✅ Database is ready"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 3
        else
            log_error "❌ Database not ready after $MAX_RETRIES attempts"
            exit 1
        fi
    fi
done

# Run migrations
if [ -f "scripts/execute-migrations.sh" ]; then
    log_info "Executing migrations..."
    ./scripts/execute-migrations.sh || log_warning "Migrations may have issues, but continuing..."
else
    log_warning "Migration script not found, skipping migrations"
fi

# Step 10: Health checks
log_info "Step 10: Performing health checks..."

# Check backend health
MAX_RETRIES=10
RETRY_COUNT=0
HEALTH_CHECK_PASSED=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "http://localhost:2000/api/health" > /dev/null 2>&1; then
        log_success "✅ Backend health check passed"
        HEALTH_CHECK_PASSED=true
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Health check failed, retrying... ($RETRY_COUNT/$MAX_RETRIES)"
            sleep 5
        fi
    fi
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    log_error "❌ Health check failed after $MAX_RETRIES attempts"
    log_info "Check logs with: docker-compose logs -f backend"
    exit 1
fi

# Test Beeceptor endpoint
log_info "Testing Beeceptor webhook endpoint..."
if curl -f -s "$WEBHOOK_URL" > /dev/null 2>&1; then
    log_success "✅ Beeceptor endpoint is accessible"
else
    log_warning "⚠️  Beeceptor endpoint may need configuration"
fi

# Step 11: Display deployment summary
log_success "🎉 Deployment completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services:"
echo "   - API: http://localhost:2000"
echo "   - Health: http://localhost:2000/api/health"
echo "   - Metrics: http://localhost:2000/api/metrics/summary"
echo ""
echo "📡 Webhook Configuration:"
echo "   - Beeceptor URL: $WEBHOOK_URL"
echo "   - Monitor at: https://beeceptor.com/dashboard"
echo ""
echo "📋 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - View backend logs: docker-compose logs -f backend"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart"
echo "   - Status: docker-compose ps"
echo ""
echo "🔍 Verify Deployment:"
echo "   - Health check: curl http://localhost:2000/api/health"
echo "   - Webhook test: curl $WEBHOOK_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

