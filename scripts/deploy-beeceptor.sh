#!/bin/bash
# Deploy with Beeceptor Webhook Configuration
# Configures webhooks to use Beeceptor endpoint and runs deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Beeceptor configuration
BEEceptor_URL="${BEEceptor_URL:-https://378to492.free.beeceptor.com}"
WEBHOOK_URL="${WEBHOOK_URL:-$BEEceptor_URL}"

echo "🚀 Deploying with Beeceptor Webhook Configuration..."
echo "📡 Webhook URL: $WEBHOOK_URL"

# Set working directory
cd "$SCRIPT_DIR/.."

# Check prerequisites
log_info "Checking prerequisites..."
check_command docker
check_command docker-compose

# Check if Docker daemon is running
if ! docker info > /dev/null 2>&1; then
    log_error "❌ Docker daemon is not running"
    log_error "   Please start Docker Desktop and try again"
    log_info "   After starting Docker, run: ./scripts/deploy-beeceptor.sh"
    exit 1
fi

# Export webhook URL for deployment
export WEBHOOK_URL
export BEEceptor_URL

# Set environment (default to staging for testing)
export ENVIRONMENT="${ENVIRONMENT:-staging}"
export NODE_ENV="${NODE_ENV:-production}"

log_info "Environment: $ENVIRONMENT"
log_info "Webhook URL: $WEBHOOK_URL"

# Check if .env file exists, create if not
if [ ! -f ".env" ]; then
    log_warning ".env file not found, creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log_info "Created .env from .env.example"
    elif [ -f "config/production.env.example" ]; then
        cp config/production.env.example .env
        log_info "Created .env from config/production.env.example"
    else
        log_warning "No .env.example found, proceeding with environment variables"
    fi
fi

# Update .env with webhook URL if it exists
if [ -f ".env" ]; then
    if grep -q "^WEBHOOK_URL=" .env; then
        # Update existing WEBHOOK_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        else
            # Linux
            sed -i "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        fi
        log_info "Updated WEBHOOK_URL in .env"
    else
        # Append WEBHOOK_URL
        echo "" >> .env
        echo "# Beeceptor Webhook Configuration" >> .env
        echo "WEBHOOK_URL=$WEBHOOK_URL" >> .env
        echo "BEEceptor_URL=$BEEceptor_URL" >> .env
        log_info "Added WEBHOOK_URL to .env"
    fi
fi

# Update alertmanager configuration if it exists
ALERTMANAGER_CONFIG="infrastructure/monitoring/alertmanager.yml"
if [ -f "$ALERTMANAGER_CONFIG" ]; then
    log_info "Updating AlertManager configuration with Beeceptor URL..."
    
    # Backup original config
    cp "$ALERTMANAGER_CONFIG" "${ALERTMANAGER_CONFIG}.backup"
    
    # Update webhook URL in alertmanager config
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|url: 'http://webhook-service:5001/webhook'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
        sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
    else
        # Linux
        sed -i "s|url: 'http://webhook-service:5001/webhook'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
        sed -i "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
    fi
    
    log_success "✅ AlertManager configuration updated"
fi

# Update production monitoring config if it exists
PROD_MONITORING_CONFIG="infrastructure/monitoring/production-monitoring.yaml"
if [ -f "$PROD_MONITORING_CONFIG" ]; then
    log_info "Updating production monitoring configuration..."
    
    # Backup original config
    cp "$PROD_MONITORING_CONFIG" "${PROD_MONITORING_CONFIG}.backup"
    
    # Update webhook URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING_CONFIG"
    else
        # Linux
        sed -i "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING_CONFIG"
    fi
    
    log_success "✅ Production monitoring configuration updated"
fi

# Run database migrations if needed
log_info "Checking database migrations..."
if [ -f "scripts/execute-migrations.sh" ]; then
    log_info "Running database migrations..."
    ./scripts/execute-migrations.sh || log_warning "Migrations may have failed, continuing..."
else
    log_warning "Migration script not found, skipping migrations"
fi

# Build and deploy services
log_info "Building Docker images..."
if docker-compose -f docker-compose.yml build; then
    log_success "✅ Build completed"
else
    log_error "❌ Build failed"
    exit 1
fi

# Deploy services
log_info "Deploying services..."
if docker-compose -f docker-compose.yml up -d; then
    log_success "✅ Services deployed"
else
    log_error "❌ Deployment failed"
    exit 1
fi

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 15

# Health check
log_info "Performing health check..."
MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s "http://localhost:2000/api/health" > /dev/null 2>&1; then
        log_success "✅ Health check passed"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            log_warning "Health check failed, retrying ($RETRY_COUNT/$MAX_RETRIES)..."
            sleep 5
        else
            log_error "❌ Health check failed after $MAX_RETRIES attempts"
            log_info "Check logs with: docker-compose logs -f backend"
            exit 1
        fi
    fi
done

# Test webhook endpoint
log_info "Testing Beeceptor webhook endpoint..."
if curl -f -s "$WEBHOOK_URL" > /dev/null 2>&1; then
    log_success "✅ Beeceptor endpoint is accessible"
else
    log_warning "⚠️  Beeceptor endpoint may not be configured yet"
    log_info "Visit $WEBHOOK_URL to configure your Beeceptor endpoint"
fi

# Display deployment information
log_success "🎉 Deployment completed successfully!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Deployment Information"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Services:"
echo "   - API: http://localhost:2000"
echo "   - Health: http://localhost:2000/api/health"
echo "   - Metrics: http://localhost:2000/api/metrics/summary"
echo ""
echo "📡 Webhook Configuration:"
echo "   - Beeceptor URL: $WEBHOOK_URL"
echo "   - Configure at: https://beeceptor.com/dashboard"
echo ""
echo "📋 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart: docker-compose restart"
echo ""
echo "🔍 Monitor Webhooks:"
echo "   - Visit: $WEBHOOK_URL"
echo "   - Check Beeceptor dashboard for incoming webhooks"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

