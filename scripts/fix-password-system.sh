#!/bin/bash
# Fix Password System - Run Missing Migrations
# This script fixes the password_entries table issue

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🔧 Fixing Password System..."
echo ""

cd "$SCRIPT_DIR/.."

# Step 1: Check current state
log_info "=== Step 1: Checking Current State ==="
TABLE_EXISTS=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_entries');" 2>/dev/null | tr -d ' ' || echo "f")

if [ "$TABLE_EXISTS" = "t" ]; then
    log_success "✅ password_entries table already exists"
    log_info "No action needed - system is already fixed"
    exit 0
else
    log_warning "⚠️  password_entries table does NOT exist"
fi

# Step 2: Check if migrations table exists
log_info ""
log_info "=== Step 2: Checking Migrations Table ==="
MIGRATIONS_TABLE=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__diesel_schema_migrations');" 2>/dev/null | tr -d ' ' || echo "f")

if [ "$MIGRATIONS_TABLE" = "t" ]; then
    log_success "✅ Migrations table exists"
    log_info "Will use diesel migration run"
    USE_DIESEL=true
else
    log_warning "⚠️  Migrations table does NOT exist"
    log_info "Will run migration SQL directly"
    USE_DIESEL=false
fi

# Step 3: Run migration
log_info ""
log_info "=== Step 3: Running Migration ==="

if [ "$USE_DIESEL" = "true" ]; then
    log_info "Running migrations via diesel..."
    if docker-compose exec -T backend diesel migration run 2>&1; then
        log_success "✅ Migrations completed"
    else
        log_error "❌ Migration failed"
        log_info "Trying direct SQL approach..."
        USE_DIESEL=false
    fi
fi

if [ "$USE_DIESEL" = "false" ]; then
    log_info "Running migration SQL directly..."
    MIGRATION_FILE="backend/migrations/20251116000001_create_password_entries/up.sql"
    
    if [ -f "$MIGRATION_FILE" ]; then
        log_info "Found migration file: $MIGRATION_FILE"
        
        # Read and execute migration
        if docker-compose exec -T postgres psql -U postgres -d reconciliation_app < "$MIGRATION_FILE" 2>&1; then
            log_success "✅ Migration SQL executed successfully"
        else
            log_error "❌ Migration SQL execution failed"
            exit 1
        fi
    else
        log_error "❌ Migration file not found: $MIGRATION_FILE"
        exit 1
    fi
fi

# Step 4: Verify table creation
log_info ""
log_info "=== Step 4: Verifying Table Creation ==="
sleep 2

TABLE_EXISTS_AFTER=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_entries');" 2>/dev/null | tr -d ' ' || echo "f")

if [ "$TABLE_EXISTS_AFTER" = "t" ]; then
    log_success "✅ password_entries table now exists!"
    
    # Count entries
    ENTRY_COUNT=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT COUNT(*) FROM password_entries;" 2>/dev/null | tr -d ' ' || echo "0")
    log_info "Current password entries: $ENTRY_COUNT"
else
    log_error "❌ Table still does not exist after migration"
    exit 1
fi

# Step 5: Restart backend
log_info ""
log_info "=== Step 5: Restarting Backend ==="
log_info "Restarting backend to clear cached errors..."
docker-compose restart backend

log_info "Waiting for backend to be ready..."
sleep 10

# Step 6: Verify no errors
log_info ""
log_info "=== Step 6: Verifying No Errors ==="
RECENT_ERRORS=$(docker-compose logs backend --tail 20 2>&1 | grep -i "password.*exist\|relation.*password" | wc -l | tr -d ' ' || echo "0")

if [ "$RECENT_ERRORS" = "0" ]; then
    log_success "✅ No password-related errors in recent logs"
else
    log_warning "⚠️  Found $RECENT_ERRORS password-related errors (may be from before restart)"
    log_info "Check logs: docker-compose logs backend | grep -i password"
fi

# Summary
log_info ""
log_info "=== Summary ==="
log_success "✅ Password system fixed!"
log_info ""
log_info "Next steps:"
log_info "  1. Monitor backend logs: docker-compose logs -f backend"
log_info "  2. Test password manager API: curl http://localhost:2000/api/passwords"
log_info "  3. Default passwords will be initialized on next startup"
log_info ""

