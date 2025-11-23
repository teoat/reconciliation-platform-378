#!/bin/bash
# Backend Health Check Verification Script
# Verifies backend is running and healthy

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

BACKEND_URL="${BACKEND_URL:-http://localhost:2000}"
HEALTH_ENDPOINT="${BACKEND_URL}/health"
DEPENDENCIES_ENDPOINT="${BACKEND_URL}/health/dependencies"
RESILIENCE_ENDPOINT="${BACKEND_URL}/health/resilience"

echo "🏥 Verifying Backend Health..."
echo ""

# Check if backend is reachable
log_info "Checking backend connectivity..."
if curl -s -f --max-time 5 "${HEALTH_ENDPOINT}" > /dev/null 2>&1; then
    log_success "✅ Backend is reachable at ${BACKEND_URL}"
else
    log_error "❌ Backend is not reachable at ${BACKEND_URL}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if backend is running:"
    echo "   cd backend && cargo run"
    echo ""
    echo "2. Check if port 2000 is in use:"
    echo "   lsof -i :2000"
    echo ""
    echo "3. Check backend logs for errors"
    echo ""
    exit 1
fi

# Check basic health
log_info "Checking basic health endpoint..."
HEALTH_RESPONSE=$(curl -s "${HEALTH_ENDPOINT}" 2>/dev/null || echo "")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    log_success "✅ Basic health check: HEALTHY"
    echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
    log_warning "⚠️  Basic health check: UNHEALTHY or unexpected response"
    echo "$HEALTH_RESPONSE"
fi

echo ""

# Check dependencies
log_info "Checking dependencies status..."
DEPS_RESPONSE=$(curl -s "${DEPENDENCIES_ENDPOINT}" 2>/dev/null || echo "")
if echo "$DEPS_RESPONSE" | grep -q '"status":"healthy"'; then
    log_success "✅ Dependencies check: HEALTHY"
    echo "$DEPS_RESPONSE" | jq '.' 2>/dev/null || echo "$DEPS_RESPONSE"
else
    log_warning "⚠️  Dependencies check: Some dependencies may be unhealthy"
    echo "$DEPS_RESPONSE" | jq '.' 2>/dev/null || echo "$DEPS_RESPONSE"
fi

echo ""

# Check resilience
log_info "Checking resilience status..."
RESILIENCE_RESPONSE=$(curl -s "${RESILIENCE_ENDPOINT}" 2>/dev/null || echo "")
if [ -n "$RESILIENCE_RESPONSE" ]; then
    log_success "✅ Resilience status retrieved"
    echo "$RESILIENCE_RESPONSE" | jq '.' 2>/dev/null || echo "$RESILIENCE_RESPONSE"
else
    log_warning "⚠️  Could not retrieve resilience status"
fi

echo ""
log_success "🎉 Health check verification complete!"


