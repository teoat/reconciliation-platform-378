#!/bin/bash
# Verify Security Headers Script
# Checks that all required security headers are present

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔒 Verifying security headers..."

# Configuration
API_URL="${API_URL:-http://localhost:2000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:1000}"

# Required headers
declare -A REQUIRED_HEADERS=(
    ["Content-Security-Policy"]="CSP"
    ["Strict-Transport-Security"]="HSTS"
    ["X-Frame-Options"]="X-Frame-Options"
    ["X-Content-Type-Options"]="X-Content-Type-Options"
    ["X-XSS-Protection"]="X-XSS-Protection"
    ["Referrer-Policy"]="Referrer-Policy"
)

# Function to check headers
check_headers() {
    local url=$1
    local service=$2
    
    log_info "Checking $service headers: $url"
    
    headers=$(curl -sI "$url" 2>/dev/null)
    if [ $? -ne 0 ]; then
        log_error "❌ Could not connect to $url"
        return 1
    fi
    
    all_present=true
    for header in "${!REQUIRED_HEADERS[@]}"; do
        value=$(echo "$headers" | grep -i "$header" | cut -d: -f2- | xargs)
        if [ -n "$value" ]; then
            log_success "✅ $header: $value"
        else
            log_error "❌ $header: Missing"
            all_present=false
        fi
    done
    
    return $([ "$all_present" = true ] && echo 0 || echo 1)
}

# Check backend headers
log_info "Checking backend security headers..."
backend_ok=true
if ! check_headers "$API_URL/health" "Backend"; then
    backend_ok=false
fi

# Check frontend headers (if accessible)
log_info "Checking frontend security headers..."
frontend_ok=true
if ! check_headers "$FRONTEND_URL" "Frontend"; then
    frontend_ok=false
fi

# Summary
log_info "📊 Security Headers Summary:"
if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ]; then
    log_success "✅ All security headers present"
    exit 0
else
    log_error "❌ Some security headers are missing"
    exit 1
fi

