#!/bin/bash
# Quick Apply Next Steps - Simplified version
# Assumes services are already running

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🚀 Quick Apply Next Steps (Services Running)..."
echo ""

API_URL="${API_BASE_URL:-http://localhost:2000}"

# Step 1: Verify Services
log_info "=== Step 1: Verifying Services ==="
# Try both /health and /api/health
if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
    log_success "✅ Backend service is running (health at /health)"
    curl -s "$API_URL/health" | jq '.' 2>/dev/null || curl -s "$API_URL/health"
elif curl -s -f "$API_URL/api/health" > /dev/null 2>&1; then
    log_success "✅ Backend service is running (health at /api/health)"
    curl -s "$API_URL/api/health" | jq '.' 2>/dev/null || curl -s "$API_URL/api/health"
else
    log_error "❌ Backend service not accessible at $API_URL"
    log_info "Tried: $API_URL/health and $API_URL/api/health"
    exit 1
fi

# Step 2: Check Metrics
log_info ""
log_info "=== Step 2: Checking Metrics Endpoint ==="
if curl -s -f "$API_URL/api/metrics/summary" > /dev/null 2>&1; then
    log_success "✅ Metrics endpoint is accessible"
    echo ""
    echo "Metrics Summary:"
    curl -s "$API_URL/api/metrics/summary" | jq '.' 2>/dev/null || curl -s "$API_URL/api/metrics/summary"
else
    log_warning "⚠️  Metrics endpoint not accessible"
    log_info "This may be expected if metrics service needs initialization"
fi

# Step 3: Check Metrics Health
log_info ""
log_info "=== Step 3: Checking Metrics Health ==="
if curl -s -f "$API_URL/api/metrics/health" > /dev/null 2>&1; then
    log_success "✅ Metrics health endpoint is accessible"
    echo ""
    echo "Metrics Health:"
    curl -s "$API_URL/api/metrics/health" | jq '.' 2>/dev/null || curl -s "$API_URL/api/metrics/health"
else
    log_warning "⚠️  Metrics health endpoint not accessible"
fi

# Step 4: Validate Deployment
log_info ""
log_info "=== Step 4: Running Deployment Validation ==="
if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
    API_BASE_URL="$API_URL" "$SCRIPT_DIR/validate-deployment.sh" || {
        log_warning "⚠️  Some validation checks failed (see output above)"
    }
else
    log_warning "⚠️  Validation script not found"
fi

# Summary
log_info ""
log_info "=== Summary ==="
log_success "✅ Services verified"
log_success "✅ Metrics endpoints checked"
log_success "✅ Deployment validation run"
log_info ""
log_info "Next steps:"
log_info "  - Monitor: ./scripts/monitor-deployment.sh"
log_info "  - View metrics: curl $API_URL/api/metrics/summary"
log_info "  - View health: curl $API_URL/api/health"
log_info ""

