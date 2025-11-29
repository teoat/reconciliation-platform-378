#!/bin/bash
# Run All Scripts - Complete Execution
# Executes all relevant scripts in proper order for full system setup and verification

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

cd "$SCRIPT_DIR/.."

echo "🚀 Running All Scripts - Complete Execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Track results
PASSED=0
FAILED=0
SKIPPED=0

# Function to run script safely
run_script() {
    local script_path=$1
    local script_name=$(basename "$script_path")
    local description=${2:-$script_name}
    
    if [ ! -f "$script_path" ]; then
        log_warning "⚠️  Script not found: $script_path (skipping)"
        ((SKIPPED++))
        return 0
    fi
    
    if [ ! -x "$script_path" ]; then
        log_warning "⚠️  Script not executable: $script_path (making executable)"
        chmod +x "$script_path"
    fi
    
    log_info "Running: $description"
    
    if bash "$script_path" 2>&1 | tee /tmp/script_output.log; then
        log_success "✅ $description completed"
        ((PASSED++))
        return 0
    else
        local exit_code=$?
        if [ $exit_code -eq 0 ]; then
            log_success "✅ $description completed"
            ((PASSED++))
            return 0
        else
            log_warning "⚠️  $description had issues (exit code: $exit_code)"
            ((FAILED++))
            # Don't exit - continue with other scripts
            return 0
        fi
    fi
}

# Phase 1: Configuration & Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Phase 1: Configuration & Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_script "scripts/configure-webhook-complete.sh" "Webhook Configuration"
run_script "scripts/configure-beeceptor.sh" "Beeceptor Setup"

# Phase 2: Database & Migrations
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Phase 2: Database & Migrations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if migrations are needed
MIGRATION_COUNT=$(docker-compose exec -T postgres psql -U postgres -d reconciliation_app -t -c "SELECT COUNT(*) FROM __diesel_schema_migrations;" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$MIGRATION_COUNT" -lt 5 ]; then
    log_info "Running database migrations..."
    export DATABASE_URL="postgresql://postgres:postgres_pass@localhost:5432/reconciliation_app"
    run_script "scripts/execute-migrations.sh" "Database Migrations"
else
    log_info "Migrations already applied ($MIGRATION_COUNT migrations found)"
    ((SKIPPED++))
fi

# Phase 3: Verification
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Phase 3: System Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_script "scripts/verify-deployment.sh" "Deployment Verification"
run_script "scripts/test-webhook-integration.sh" "Webhook Integration Test"
run_script "scripts/verify-all-services.sh" "All Services Verification" || true
run_script "scripts/health-check-all.sh" "Health Checks" || true

# Phase 4: Validation
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Phase 4: Validation & Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_script "scripts/validate-deployment.sh" "Deployment Validation" || true
run_script "scripts/validate-imports.sh" "Import Validation" || true
run_script "scripts/validate-ssot.sh" "SSOT Validation" || true
run_script "scripts/validate-secrets.sh" "Secrets Validation" || true

# Phase 5: Testing (if requested)
if [ "${RUN_TESTS:-false}" = "true" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Phase 5: Testing"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    run_script "scripts/run-tests-quick.sh" "Quick Tests" || true
    run_script "scripts/smoke-tests.sh" "Smoke Tests" || true
fi

# Phase 6: Diagnostics (optional)
if [ "${RUN_DIAGNOSTICS:-false}" = "true" ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📋 Phase 6: Diagnostics"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    run_script "scripts/run-all-diagnostics.sh" "All Diagnostics" || true
fi

# Final Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Execution Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "⏭️  Skipped: $SKIPPED"
echo ""

if [ $FAILED -eq 0 ]; then
    log_success "🎉 All critical scripts executed successfully!"
    exit 0
else
    log_warning "⚠️  Some scripts had issues, but execution completed"
    exit 0
fi

