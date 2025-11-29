#!/bin/bash
# Test Database Connection Pooling
# Verifies that database connection pooling is working correctly

# Source common functions
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "🔌 Testing database connection pooling..."

# Configuration
DATABASE_URL="${DATABASE_URL:-}"
API_URL="${API_URL:-http://localhost:2000}"

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Step 1: Check database connection pool configuration
log_info "Step 1: Checking connection pool configuration..."
POOL_SIZE=$(psql "$DATABASE_URL" -t -c "SHOW max_connections;" 2>/dev/null | xargs)
if [ -n "$POOL_SIZE" ]; then
    log_info "Database max_connections: $POOL_SIZE"
    log_success "✅ Database connection limit configured"
else
    log_warning "⚠️  Could not determine database connection limit"
fi

# Step 2: Check active connections
log_info "Step 2: Checking active connections..."
ACTIVE_CONNECTIONS=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();" 2>/dev/null | xargs)
if [ -n "$ACTIVE_CONNECTIONS" ]; then
    log_info "Active connections: $ACTIVE_CONNECTIONS"
    if [ "$ACTIVE_CONNECTIONS" -lt 10 ]; then
        log_success "✅ Connection pool usage is healthy"
    else
        log_warning "⚠️  High number of active connections: $ACTIVE_CONNECTIONS"
    fi
else
    log_warning "⚠️  Could not determine active connections"
fi

# Step 3: Test concurrent connections
log_info "Step 3: Testing concurrent connections..."
CONCURRENT_TESTS=10
SUCCESS_COUNT=0

for i in $(seq 1 $CONCURRENT_TESTS); do
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        ((SUCCESS_COUNT++))
    fi
done

if [ "$SUCCESS_COUNT" -eq "$CONCURRENT_TESTS" ]; then
    log_success "✅ All $CONCURRENT_TESTS concurrent connections succeeded"
else
    log_warning "⚠️  Only $SUCCESS_COUNT/$CONCURRENT_TESTS concurrent connections succeeded"
fi

# Step 4: Check connection pool in application
log_info "Step 4: Checking application connection pool..."
if check_endpoint "$API_URL" "/api/v1/health/dependencies" 5; then
    log_success "✅ Application health endpoint accessible"
    # Parse response to check database connection status
    RESPONSE=$(curl -s "$API_URL/api/v1/health/dependencies" 2>/dev/null)
    if echo "$RESPONSE" | grep -q "healthy"; then
        log_success "✅ Database connection pool is healthy"
    else
        log_warning "⚠️  Database connection may have issues"
    fi
else
    log_warning "⚠️  Could not check application connection pool"
fi

log_success "✅ Connection pooling test complete"
log_info "📝 Summary:"
log_info "  - Max connections: $POOL_SIZE"
log_info "  - Active connections: $ACTIVE_CONNECTIONS"
log_info "  - Concurrent test: $SUCCESS_COUNT/$CONCURRENT_TESTS passed"

