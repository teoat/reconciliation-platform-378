#!/bin/bash
# Configure Beeceptor Webhook (Configuration Only)
# Sets up webhook configuration without requiring Docker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Beeceptor configuration
BEEceptor_URL="${BEEceptor_URL:-https://378to492.free.beeceptor.com}"
WEBHOOK_URL="${WEBHOOK_URL:-$BEEceptor_URL}"

echo "📡 Configuring Beeceptor Webhook..."
echo "🌐 Webhook URL: $WEBHOOK_URL"

# Set working directory
cd "$SCRIPT_DIR/.."

# Export webhook URL
export WEBHOOK_URL
export BEEceptor_URL

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
        log_warning "No .env.example found, creating minimal .env"
        touch .env
    fi
fi

# Update .env with webhook URL
if [ -f ".env" ]; then
    if grep -q "^WEBHOOK_URL=" .env; then
        # Update existing WEBHOOK_URL
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        else
            sed -i "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        fi
        log_success "✅ Updated WEBHOOK_URL in .env"
    else
        # Append WEBHOOK_URL
        echo "" >> .env
        echo "# Beeceptor Webhook Configuration" >> .env
        echo "WEBHOOK_URL=$WEBHOOK_URL" >> .env
        echo "BEEceptor_URL=$BEEceptor_URL" >> .env
        log_success "✅ Added WEBHOOK_URL to .env"
    fi
fi

# Update alertmanager configuration if it exists
ALERTMANAGER_CONFIG="infrastructure/monitoring/alertmanager.yml"
if [ -f "$ALERTMANAGER_CONFIG" ]; then
    log_info "Updating AlertManager configuration..."
    
    # Backup original config
    if [ ! -f "${ALERTMANAGER_CONFIG}.backup" ]; then
        cp "$ALERTMANAGER_CONFIG" "${ALERTMANAGER_CONFIG}.backup"
        log_info "Created backup: ${ALERTMANAGER_CONFIG}.backup"
    fi
    
    # Update webhook URL in alertmanager config
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|url: 'http://webhook-service:5001/webhook'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
        sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$ALERTMANAGER_CONFIG"
    else
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
    if [ ! -f "${PROD_MONITORING_CONFIG}.backup" ]; then
        cp "$PROD_MONITORING_CONFIG" "${PROD_MONITORING_CONFIG}.backup"
        log_info "Created backup: ${PROD_MONITORING_CONFIG}.backup"
    fi
    
    # Update webhook URL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING_CONFIG"
    else
        sed -i "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING_CONFIG"
    fi
    
    log_success "✅ Production monitoring configuration updated"
fi

# Test webhook endpoint
log_info "Testing Beeceptor webhook endpoint..."
if curl -f -s "$WEBHOOK_URL" > /dev/null 2>&1; then
    log_success "✅ Beeceptor endpoint is accessible"
else
    log_warning "⚠️  Beeceptor endpoint may not be configured yet"
    log_info "Visit $WEBHOOK_URL to configure your Beeceptor endpoint"
fi

# Display configuration summary
log_success "🎉 Beeceptor webhook configuration completed!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 Webhook Configuration:"
echo "   - Beeceptor URL: $WEBHOOK_URL"
echo "   - Configure at: https://beeceptor.com/dashboard"
echo ""
echo "📁 Updated Files:"
echo "   - .env (WEBHOOK_URL added/updated)"
if [ -f "$ALERTMANAGER_CONFIG" ]; then
    echo "   - $ALERTMANAGER_CONFIG (webhook URL updated)"
fi
if [ -f "$PROD_MONITORING_CONFIG" ]; then
    echo "   - $PROD_MONITORING_CONFIG (webhook URL updated)"
fi
echo ""
echo "🚀 Next Steps:"
echo "   1. Start Docker Desktop (if not running)"
echo "   2. Run: ./scripts/deploy-beeceptor.sh"
echo "   3. Monitor webhooks at: $WEBHOOK_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

