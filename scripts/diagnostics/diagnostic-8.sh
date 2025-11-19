#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 8: Database & Schema Analysis
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-8-results.json}"

log_info "Starting Database & Schema Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Database connectivity
log_info "Checking database connectivity..."
if docker ps --format "{{.Names}}" | grep -q "reconciliation-postgres"; then
    if docker exec reconciliation-postgres pg_isready -U postgres >/dev/null 2>&1; then
        DB_VERSION=$(docker exec reconciliation-postgres psql -U postgres -tAc "SELECT version();" 2>/dev/null | head -n1)
        log_success "Database is accessible"
        add_check "db_connectivity" "success" "Database accessible" "$DB_VERSION"
    else
        log_error "Database not ready"
        add_check "db_connectivity" "error" "Database not ready" ""
    fi
else
    log_warning "Database container not running"
    add_check "db_connectivity" "warning" "Container not running" ""
fi

# 2. Schema migrations
log_info "Checking schema migrations..."
if [ -d "backend/migrations" ]; then
    MIGRATION_COUNT=$(find backend/migrations -name "*.sql" 2>/dev/null | wc -l | tr -d ' ')
    log_success "Found $MIGRATION_COUNT migration files"
    add_check "migrations" "success" "$MIGRATION_COUNT migrations" ""
else
    log_warning "No migrations directory"
    add_check "migrations" "warning" "No migrations found" ""
fi

# 3. Missing indexes
log_info "Checking for missing indexes..."
if docker ps --format "{{.Names}}" | grep -q "reconciliation-postgres"; then
    MISSING=$(docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -tAc \
        "SELECT COUNT(*) FROM pg_stat_user_tables WHERE seq_scan > idx_scan AND seq_scan > 100;" 2>/dev/null || echo "0")
    if [ "$MISSING" -gt 0 ]; then
        log_warning "Found $MISSING tables needing indexes"
        add_check "indexes" "warning" "$MISSING tables need indexes" ""
    else
        log_success "Indexes look good"
        add_check "indexes" "success" "Indexes adequate" ""
    fi
fi

# 4. Database size
log_info "Checking database size..."
if docker ps --format "{{.Names}}" | grep -q "reconciliation-postgres"; then
    DB_SIZE=$(docker exec reconciliation-postgres psql -U postgres -tAc \
        "SELECT pg_database_size('reconciliation_app');" 2>/dev/null || echo "0")
    DB_SIZE_MB=$((DB_SIZE / 1024 / 1024))
    log_info "Database size: ${DB_SIZE_MB}MB"
    add_check "db_size" "success" "Size: ${DB_SIZE_MB}MB" ""
fi

log_success "Database & Schema Analysis complete"
cat "$RESULTS_FILE" | jq '.'

