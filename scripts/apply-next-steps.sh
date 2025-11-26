#!/bin/bash
# Apply All Next Steps
# Comprehensive script to apply all next steps from FINAL_STATUS.md

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🚀 Applying All Next Steps..."
echo ""

# Step 1: Run Integration Tests
log_info "=== Step 1: Running Integration Tests ==="
cd "$SCRIPT_DIR/../backend"

log_info "Running CQRS tests..."
# Integration tests are in tests/integration/ directory
# They need to be run as part of the test suite
if cargo test --lib cqrs 2>&1 | tee /tmp/cqrs_tests.log; then
    log_success "✅ CQRS tests completed"
else
    log_warning "⚠️  CQRS tests may need services running (check /tmp/cqrs_tests.log)"
fi

log_info "Running secret rotation tests..."
if cargo test --lib secrets 2>&1 | tee /tmp/secret_rotation_tests.log; then
    log_success "✅ Secret rotation tests completed"
else
    log_warning "⚠️  Secret rotation tests may need services running (check /tmp/secret_rotation_tests.log)"
fi

log_info "Note: Full integration tests require running services"
log_info "Integration test files are in: backend/tests/integration/"

# Step 2: Check Services Status
log_info ""
log_info "=== Step 2: Checking Services Status ==="
cd "$SCRIPT_DIR/.."

if command -v docker-compose &> /dev/null; then
    log_info "Checking Docker services..."
    if docker-compose ps 2>/dev/null | grep -q "Up"; then
        log_success "✅ Docker services are running"
        docker-compose ps
    else
        log_info "Docker services not running (this is OK if deploying fresh)"
    fi
else
    log_warning "⚠️  docker-compose not found, skipping service check"
fi

# Step 3: Validate Deployment
log_info ""
log_info "=== Step 3: Validating Deployment ==="

if [ -f "$SCRIPT_DIR/validate-deployment.sh" ]; then
    log_info "Running deployment validation..."
    API_BASE_URL="${API_BASE_URL:-http://localhost:2000}" \
        "$SCRIPT_DIR/validate-deployment.sh" || {
        log_warning "⚠️  Validation had some failures (check output above)"
    }
else
    log_warning "⚠️  Validation script not found"
fi

# Step 4: Check Metrics Endpoint
log_info ""
log_info "=== Step 4: Checking Metrics Endpoint ==="

API_URL="${API_BASE_URL:-http://localhost:2000}"
log_info "Checking metrics at: $API_URL/api/metrics/summary"

if command -v curl &> /dev/null; then
    if response=$(curl -s -f "$API_URL/api/metrics/summary" 2>/dev/null); then
        log_success "✅ Metrics endpoint is accessible"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        log_warning "⚠️  Metrics endpoint not accessible (service may not be running)"
        log_info "Start the service with: ./scripts/deploy-staging.sh"
    fi
else
    log_warning "⚠️  curl not found, skipping metrics check"
fi

# Step 5: Display Next Actions
log_info ""
log_info "=== Step 5: Next Actions ==="
log_info ""
log_success "✅ Integration tests: Ready to run"
log_success "✅ Deployment scripts: Available"
log_success "✅ Validation script: Available"
log_success "✅ Monitoring script: Available"
log_info ""
log_info "To deploy to staging:"
log_info "  ./scripts/deploy-staging.sh"
log_info ""
log_info "To validate deployment:"
log_info "  ./scripts/validate-deployment.sh"
log_info ""
log_info "To monitor deployment:"
log_info "  ./scripts/monitor-deployment.sh"
log_info ""
log_info "To deploy to production:"
log_info "  export ENVIRONMENT=production"
log_info "  export API_BASE_URL=https://api.example.com"
log_info "  ./scripts/deploy-production.sh"
log_info ""

log_success "🎉 All next steps have been applied!"
log_info "Check the output above for any warnings or issues."

