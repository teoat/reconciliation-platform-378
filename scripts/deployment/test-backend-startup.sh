#!/bin/bash
# Test backend startup with tier-based error handling

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

log_info "Testing backend startup with tier-based error handling..."

# Check if backend is running
if ! docker-compose -f docker-compose.dev.yml ps backend | grep -q "Up"; then
    log_error "Backend container is not running"
    exit 1
fi

log_info "✅ Backend container is running"

# Check backend logs for startup messages
log_info "Checking backend logs for startup messages..."
if docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -q "async_main() called"; then
    log_success "✅ Main function was called"
else
    log_warning "⚠️  Main function call not found in logs"
fi

# Check for tier-based validation messages
if docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -q "database_connection\|redis_connection\|environment_validation"; then
    log_success "✅ Tier-based validation messages found"
else
    log_warning "⚠️  Tier-based validation messages not found"
fi

# Check for panic files
log_info "Checking for panic files..."
if docker-compose -f docker-compose.dev.yml exec -T backend sh -c "test -f /tmp/backend-panic.txt" 2>&1; then
    log_error "❌ Panic file found - backend crashed!"
    docker-compose -f docker-compose.dev.yml exec -T backend cat /tmp/backend-panic.txt 2>&1
    exit 1
else
    log_success "✅ No panic files found"
fi

# Test health endpoint
log_info "Testing health endpoint..."
if curl -s -f http://localhost:2000/api/health > /dev/null 2>&1; then
    log_success "✅ Health endpoint is responding"
    curl -s http://localhost:2000/api/health | jq '.' 2>&1 || curl -s http://localhost:2000/api/health
else
    log_warning "⚠️  Health endpoint not responding yet"
fi

# Check database connection
log_info "Checking database connection status..."
if docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -q "Database connection verified\|Database initialized"; then
    log_success "✅ Database connection successful"
else
    log_warning "⚠️  Database connection status unclear"
fi

# Check Redis connection (or fallback)
log_info "Checking Redis connection status..."
if docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -q "Redis unavailable.*in-memory cache"; then
    log_warning "⚠️  Redis unavailable - using in-memory cache fallback (expected behavior)"
elif docker-compose -f docker-compose.dev.yml logs backend 2>&1 | grep -q "Cache initialized\|Redis"; then
    log_success "✅ Redis connection successful"
else
    log_warning "⚠️  Redis connection status unclear"
fi

log_info "Backend startup test complete"

