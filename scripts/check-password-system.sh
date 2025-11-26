#!/bin/bash
# Comprehensive Password System Check
# Checks database state, migrations, and system configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

echo "🔍 Comprehensive Password System Check"
echo ""

# Check 1: Database Connection
log_info "=== Check 1: Database Connection ==="
if docker-compose ps postgres | grep -q "Up"; then
    log_success "✅ PostgreSQL container is running"
else
    log_error "❌ PostgreSQL container is not running"
    exit 1
fi

# Check 2: Migration Status
log_info ""
log_info "=== Check 2: Migration Status ==="
if docker-compose exec -T backend diesel migration list 2>/dev/null | grep -q "20251116000001"; then
    log_success "✅ Password entries migration exists"
    MIGRATION_STATUS=$(docker-compose exec -T backend diesel migration list 2>/dev/null | grep "20251116000001" || echo "not found")
    log_info "Migration status: $MIGRATION_STATUS"
else
    log_warning "⚠️  Password entries migration not found in list"
fi

# Check 3: Table Existence
log_info ""
log_info "=== Check 3: Table Existence ==="
TABLES=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%password%';" 2>/dev/null | tr -d ' ' || echo "")

if echo "$TABLES" | grep -q "password_entries"; then
    log_success "✅ password_entries table exists"
    TABLE_COUNT=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT COUNT(*) FROM password_entries;" 2>/dev/null | tr -d ' ' || echo "0")
    log_info "Password entries count: $TABLE_COUNT"
else
    log_error "❌ password_entries table does NOT exist"
    log_info "This is the root cause of the errors"
fi

if echo "$TABLES" | grep -q "password_audit_log"; then
    log_success "✅ password_audit_log table exists"
else
    log_warning "⚠️  password_audit_log table does NOT exist"
fi

# Check 4: All Tables
log_info ""
log_info "=== Check 4: All Database Tables ==="
ALL_TABLES=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>/dev/null | tr -d ' ' | grep -v "^$" || echo "")
log_info "Total tables: $(echo "$ALL_TABLES" | wc -l | tr -d ' ')"
log_info "Tables:"
echo "$ALL_TABLES" | head -20

# Check 5: Migration Files
log_info ""
log_info "=== Check 5: Migration Files ==="
if [ -f "backend/migrations/20251116000001_create_password_entries/up.sql" ]; then
    log_success "✅ Migration file exists"
    MIGRATION_SIZE=$(wc -l backend/migrations/20251116000001_create_password_entries/up.sql | awk '{print $1}')
    log_info "Migration file size: $MIGRATION_SIZE lines"
else
    log_error "❌ Migration file NOT found"
fi

# Check 6: Code References
log_info ""
log_info "=== Check 6: Code References ==="
PASSWORD_MANAGER_REFS=$(grep -r "password_manager\|PasswordManager" backend/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
log_info "Password manager references in code: $PASSWORD_MANAGER_REFS"

PASSWORD_ENTRIES_REFS=$(grep -r "password_entries" backend/src --include="*.rs" 2>/dev/null | wc -l | tr -d ' ')
log_info "password_entries references in code: $PASSWORD_ENTRIES_REFS"

# Check 7: Schema Definition
log_info ""
log_info "=== Check 7: Schema Definition ==="
if grep -q "password_entries" backend/src/models/schema.rs 2>/dev/null; then
    log_success "✅ password_entries defined in schema.rs"
else
    log_warning "⚠️  password_entries NOT found in schema.rs"
fi

# Check 8: Backend Logs
log_info ""
log_info "=== Check 8: Recent Backend Logs ==="
RECENT_ERRORS=$(docker-compose logs backend --tail 50 2>&1 | grep -i "password\|table.*exist" | tail -5 || echo "No recent password errors")
if [ -n "$RECENT_ERRORS" ]; then
    log_warning "Recent password-related errors:"
    echo "$RECENT_ERRORS"
else
    log_success "✅ No recent password errors in logs"
fi

# Summary
log_info ""
log_info "=== Summary ==="
if echo "$TABLES" | grep -q "password_entries"; then
    log_success "✅ Password system is properly set up"
    log_info "Recommendation: Restart backend to clear any cached errors"
else
    log_error "❌ Password system is NOT set up"
    log_info "Root Cause: password_entries table does not exist"
    log_info ""
    log_info "Solution:"
    log_info "  1. Run migrations: docker-compose exec backend diesel migration run"
    log_info "  2. Or manually: docker-compose exec postgres psql -U postgres -d reconciliation_dev -f /path/to/migration.sql"
    log_info "  3. Restart backend: docker-compose restart backend"
fi


