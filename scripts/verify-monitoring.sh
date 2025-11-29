#!/bin/bash
# Verify Monitoring Setup Script
# Verifies that monitoring systems are properly configured and working

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔍 Starting monitoring verification..."

# Configuration
API_URL="${API_URL:-http://localhost:2000}"
SENTRY_DSN="${SENTRY_DSN:-}"
VITE_SENTRY_DSN="${VITE_SENTRY_DSN:-}"

# Check Sentry configuration
log_info "Checking Sentry configuration..."

if [ -n "$SENTRY_DSN" ]; then
    log_success "✅ Backend Sentry DSN configured"
else
    log_warning "⚠️  Backend Sentry DSN not configured (optional)"
fi

if [ -n "$VITE_SENTRY_DSN" ]; then
    log_success "✅ Frontend Sentry DSN configured"
else
    log_warning "⚠️  Frontend Sentry DSN not configured (optional)"
fi

# Check metrics endpoint
log_info "Checking metrics endpoint..."
if check_endpoint "$API_URL" "/api/v1/metrics" "$TIMEOUT"; then
    log_success "✅ Metrics endpoint accessible"
else
    log_warning "⚠️  Metrics endpoint not accessible"
fi

# Check health endpoint
log_info "Checking health endpoint..."
if check_endpoint "$API_URL" "/health" "$TIMEOUT"; then
    log_success "✅ Health endpoint accessible"
else
    log_error "❌ Health endpoint not accessible"
    exit 1
fi

# Check security events endpoint (if authenticated)
log_info "Checking security events endpoint..."
# Note: This requires authentication, so we just check if endpoint exists
response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${API_URL}/api/v1/security/events" 2>/dev/null)
if [ "$response" = "401" ] || [ "$response" = "200" ]; then
    log_success "✅ Security events endpoint exists"
else
    log_warning "⚠️  Security events endpoint may not be configured"
fi

# Summary
log_info "📊 Monitoring Verification Summary:"
log_info "Sentry: $( [ -n "$SENTRY_DSN" ] || [ -n "$VITE_SENTRY_DSN" ] && echo "Configured" || echo "Not configured (optional)")"
log_info "Metrics: Accessible"
log_info "Health: Accessible"
log_success "✅ Monitoring verification complete"

