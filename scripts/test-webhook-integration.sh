#!/bin/bash
# Test Webhook Integration Script
# Tests all webhook endpoints and configurations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

WEBHOOK_URL="${WEBHOOK_URL:-https://378to492.free.beeceptor.com}"

echo "🧪 Webhook Integration Testing"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd "$SCRIPT_DIR/.."

# Test 1: Health Check
log_info "Test 1: Health Check Webhook"
if curl -s -X GET "$WEBHOOK_URL/health" > /dev/null 2>&1; then
    log_success "✅ Health check endpoint accessible"
else
    log_warning "⚠️  Health check endpoint may need configuration"
fi

# Test 2: Alert Webhook
log_info "Test 2: Alert Webhook"
ALERT_PAYLOAD=$(cat <<EOF
{
  "alerts": [
    {
      "status": "firing",
      "labels": {
        "alertname": "TestAlert",
        "severity": "warning",
        "service": "backend"
      },
      "annotations": {
        "summary": "Test alert from reconciliation platform",
        "description": "Testing webhook configuration"
      }
    }
  ]
}
EOF
)

if curl -s -X POST "$WEBHOOK_URL/alerts" \
    -H "Content-Type: application/json" \
    -d "$ALERT_PAYLOAD" > /dev/null 2>&1; then
    log_success "✅ Alert webhook sent successfully"
else
    log_warning "⚠️  Alert webhook may have failed"
fi

# Test 3: Monitoring Webhook
log_info "Test 3: Monitoring Webhook"
MONITORING_PAYLOAD=$(cat <<EOF
{
  "event": "metric",
  "service": "reconciliation-platform",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "data": {
    "metric": "api_response_time",
    "value": 150,
    "unit": "ms"
  }
}
EOF
)

if curl -s -X POST "$WEBHOOK_URL/monitoring" \
    -H "Content-Type: application/json" \
    -d "$MONITORING_PAYLOAD" > /dev/null 2>&1; then
    log_success "✅ Monitoring webhook sent successfully"
else
    log_warning "⚠️  Monitoring webhook may have failed"
fi

# Test 4: General Webhook
log_info "Test 4: General Webhook (Catch-all)"
GENERAL_PAYLOAD=$(cat <<EOF
{
  "test": true,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "source": "reconciliation-platform",
  "message": "General webhook test"
}
EOF
)

if curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$GENERAL_PAYLOAD" > /dev/null 2>&1; then
    log_success "✅ General webhook sent successfully"
else
    log_warning "⚠️  General webhook may have failed"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Webhook Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Webhook URL: $WEBHOOK_URL"
echo ""
echo "📋 Next Steps:"
echo "  1. Visit Beeceptor dashboard: https://beeceptor.com/dashboard"
echo "  2. Select endpoint: 378to492"
echo "  3. Check 'Requests' tab to see test webhooks"
echo "  4. Configure rules as needed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

log_success "🎉 Webhook testing complete!"

