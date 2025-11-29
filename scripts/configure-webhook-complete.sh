#!/bin/bash
# Complete Webhook Configuration Script
# Fully configures Beeceptor webhook in all locations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

# Beeceptor configuration
BEEceptor_URL="${BEEceptor_URL:-https://378to492.free.beeceptor.com}"
WEBHOOK_URL="${WEBHOOK_URL:-$BEEceptor_URL}"

echo "📡 Complete Webhook Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SCRIPT_DIR/.."

# Export for use
export WEBHOOK_URL
export BEEceptor_URL

log_info "Configuring webhook: $WEBHOOK_URL"

# 1. Update .env file
log_info "1. Updating .env file..."
if [ -f ".env" ]; then
    if grep -q "^WEBHOOK_URL=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        else
            sed -i "s|^WEBHOOK_URL=.*|WEBHOOK_URL=$WEBHOOK_URL|" .env
        fi
        log_success "✅ Updated WEBHOOK_URL in .env"
    else
        echo "" >> .env
        echo "# Beeceptor Webhook Configuration" >> .env
        echo "WEBHOOK_URL=$WEBHOOK_URL" >> .env
        echo "BEEceptor_URL=$BEEceptor_URL" >> .env
        log_success "✅ Added WEBHOOK_URL to .env"
    fi
    
    # Also add to docker-compose environment
    if ! grep -q "^WEBHOOK_URL=" .env; then
        echo "WEBHOOK_URL=$WEBHOOK_URL" >> .env
    fi
fi

# 2. Update AlertManager configuration
log_info "2. Updating AlertManager configuration..."
ALERTMANAGER_FILES=(
    "infrastructure/monitoring/alertmanager.yml"
    "monitoring/alertmanager.yml"
)

for config_file in "${ALERTMANAGER_FILES[@]}"; do
    if [ -f "$config_file" ]; then
        # Backup
        if [ ! -f "${config_file}.backup" ]; then
            cp "$config_file" "${config_file}.backup"
        fi
        
        # Update all webhook URLs
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|url: 'http://webhook.*'|url: '$WEBHOOK_URL'|g" "$config_file"
            sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$config_file"
            sed -i '' "s|url: 'https://.*beeceptor.*'|url: '$WEBHOOK_URL'|g" "$config_file"
        else
            sed -i "s|url: 'http://webhook.*'|url: '$WEBHOOK_URL'|g" "$config_file"
            sed -i "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$config_file"
            sed -i "s|url: 'https://.*beeceptor.*'|url: '$WEBHOOK_URL'|g" "$config_file"
        fi
        
        log_success "✅ Updated $config_file"
    fi
done

# 3. Update production monitoring config
log_info "3. Updating production monitoring configuration..."
PROD_MONITORING="infrastructure/monitoring/production-monitoring.yaml"
if [ -f "$PROD_MONITORING" ]; then
    if [ ! -f "${PROD_MONITORING}.backup" ]; then
        cp "$PROD_MONITORING" "${PROD_MONITORING}.backup"
    fi
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING"
        sed -i '' "s|url: 'https://.*beeceptor.*'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING"
    else
        sed -i "s|url: '\${WEBHOOK_URL}'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING"
        sed -i "s|url: 'https://.*beeceptor.*'|url: '$WEBHOOK_URL'|g" "$PROD_MONITORING"
    fi
    
    log_success "✅ Updated $PROD_MONITORING"
fi

# 4. Update docker-compose.yml if it has webhook config
log_info "4. Checking docker-compose.yml..."
if grep -q "WEBHOOK_URL" docker-compose.yml 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|WEBHOOK_URL:.*|WEBHOOK_URL: \${WEBHOOK_URL:-$WEBHOOK_URL}|g" docker-compose.yml
    else
        sed -i "s|WEBHOOK_URL:.*|WEBHOOK_URL: \${WEBHOOK_URL:-$WEBHOOK_URL}|g" docker-compose.yml
    fi
    log_success "✅ Updated docker-compose.yml"
fi

# 5. Test webhook endpoint
log_info "5. Testing webhook endpoint..."
if curl -f -s "$WEBHOOK_URL" > /dev/null 2>&1; then
    log_success "✅ Beeceptor endpoint is accessible"
else
    log_warning "⚠️  Beeceptor endpoint may need configuration"
fi

# 6. Send test webhook
log_info "6. Sending test webhook..."
TEST_PAYLOAD=$(cat <<EOF
{
  "test": true,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "source": "reconciliation-platform",
  "message": "Webhook configuration test"
}
EOF
)

if curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$TEST_PAYLOAD" > /dev/null 2>&1; then
    log_success "✅ Test webhook sent successfully"
else
    log_warning "⚠️  Test webhook may have failed (check Beeceptor dashboard)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Webhook Configuration Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📡 Webhook URL: $WEBHOOK_URL"
echo ""
echo "✅ Configured in:"
echo "  • .env file"
echo "  • AlertManager configurations"
echo "  • Production monitoring config"
echo ""
echo "🔗 Next Steps:"
echo "  1. Visit: https://beeceptor.com/dashboard"
echo "  2. Select endpoint: 378to492"
echo "  3. Create rules for webhook handling"
echo "  4. Monitor incoming webhooks"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_success "🎉 Webhook configuration complete!"

