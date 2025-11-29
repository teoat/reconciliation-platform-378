#!/bin/bash
# Verify Health Checks Script
# Verifies all health check endpoints are working correctly

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔍 Starting health check verification..."

# Configuration
API_URL="${API_URL:-http://localhost:2000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"
TIMEOUT=10

# Health check endpoints
declare -a HEALTH_ENDPOINTS=(
    "/health"
    "/api/v1/health"
    "/api/v1/health/live"
    "/api/v1/health/ready"
    "/api/v1/health/startup"
)

# Function to check endpoint
check_endpoint() {
    local url=$1
    local endpoint=$2
    
    log_info "Checking: ${url}${endpoint}"
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "${url}${endpoint}" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        log_success "✅ ${endpoint} - HTTP 200"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        log_error "❌ ${endpoint} - HTTP ${http_code}"
        echo "$body"
        return 1
    fi
}

# Check backend health endpoints
log_info "Checking backend health endpoints..."
backend_healthy=true

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
    if ! check_endpoint "$API_URL" "$endpoint"; then
        backend_healthy=false
    fi
done

# Check frontend
log_info "Checking frontend..."
frontend_healthy=true

if ! check_endpoint "$FRONTEND_URL" ""; then
    frontend_healthy=false
fi

# Summary
log_info "📊 Health Check Summary:"
if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
    log_success "✅ All health checks passed"
    exit 0
else
    log_error "❌ Some health checks failed"
    exit 1
fi

