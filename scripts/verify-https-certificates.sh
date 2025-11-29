#!/bin/bash
# Verify HTTPS and Certificate Configuration
# Checks HTTPS configuration and certificate validity

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔐 Verifying HTTPS and certificate configuration..."

# Configuration
API_URL="${API_URL:-https://api.example.com}"
FRONTEND_URL="${FRONTEND_URL:-https://app.example.com}"
DAYS_BEFORE_EXPIRY=30

# Function to check certificate
check_certificate() {
    local domain=$1
    local url=$2
    
    log_info "Checking certificate for $domain..."
    
    # Extract domain from URL
    if [[ $url == https://* ]]; then
        domain=$(echo $url | sed 's|https://||' | cut -d/ -f1)
    fi
    
    # Check if HTTPS is accessible
    if ! curl -sI "$url" > /dev/null 2>&1; then
        log_error "❌ Could not connect to $url"
        return 1
    fi
    
    # Check certificate expiration
    EXPIRY_DATE=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
    
    if [ -z "$EXPIRY_DATE" ]; then
        log_error "❌ Could not retrieve certificate for $domain"
        return 1
    fi
    
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY_DATE" +%s 2>/dev/null)
    CURRENT_EPOCH=$(date +%s)
    
    if [ -n "$EXPIRY_EPOCH" ] && [ "$EXPIRY_EPOCH" -gt 0 ]; then
        DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
            log_error "❌ Certificate for $domain has EXPIRED"
            return 1
        elif [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
            log_warning "⚠️  Certificate for $domain expires in $DAYS_UNTIL_EXPIRY days"
        else
            log_success "✅ Certificate for $domain valid for $DAYS_UNTIL_EXPIRY days"
        fi
    else
        log_warning "⚠️  Could not calculate certificate expiration"
    fi
    
    # Check TLS version
    TLS_VERSION=$(echo | openssl s_client -connect "$domain:443" 2>/dev/null | grep "Protocol" | awk '{print $3}')
    if [ -n "$TLS_VERSION" ]; then
        log_info "TLS Version: $TLS_VERSION"
        if [[ "$TLS_VERSION" == "TLSv1.2" ]] || [[ "$TLS_VERSION" == "TLSv1.3" ]]; then
            log_success "✅ Using secure TLS version"
        else
            log_warning "⚠️  Using older TLS version: $TLS_VERSION"
        fi
    fi
    
    return 0
}

# Check API certificate
api_ok=true
if ! check_certificate "api.example.com" "$API_URL"; then
    api_ok=false
fi

# Check frontend certificate
frontend_ok=true
if ! check_certificate "app.example.com" "$FRONTEND_URL"; then
    frontend_ok=false
fi

# Summary
log_info "📊 HTTPS Certificate Summary:"
if [ "$api_ok" = true ] && [ "$frontend_ok" = true ]; then
    log_success "✅ All certificates are valid"
    exit 0
else
    log_error "❌ Some certificate issues found"
    exit 1
fi

