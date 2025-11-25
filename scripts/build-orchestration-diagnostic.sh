#!/bin/bash

# Build Orchestration Diagnostic Script
# Runs comprehensive diagnostics for the build orchestration process

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIAGNOSTIC_DIR="$PROJECT_ROOT/diagnostic-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Source shared functions
source "$SCRIPT_DIR/lib/common-functions.sh"

log_info "Starting Build Orchestration Diagnostic"
log_info "Timestamp: $TIMESTAMP"
log_info "Project Root: $PROJECT_ROOT"

# Create diagnostic results directory
mkdir -p "$DIAGNOSTIC_DIR"

# Phase 1: Structure Analysis
log_info "Phase 1.1: Analyzing codebase structure..."
{
    echo "=== Codebase Structure Analysis ==="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "--- Rust Files ---"
    find "$PROJECT_ROOT/backend" -name "*.rs" | wc -l | xargs echo "Total Rust files:"
    echo ""
    echo "--- TypeScript Files ---"
    find "$PROJECT_ROOT/frontend/src" -name "*.ts" -o -name "*.tsx" | wc -l | xargs echo "Total TypeScript files:"
    echo ""
    echo "--- Build Configuration Files ---"
    find "$PROJECT_ROOT" -name "Cargo.toml" -o -name "package.json" -o -name "tsconfig.json" | grep -v node_modules
    echo ""
    echo "--- Environment Files ---"
    find "$PROJECT_ROOT" -name ".env*" -o -name "*.env" | grep -v node_modules
    echo ""
    echo "--- Migration Files ---"
    find "$PROJECT_ROOT/backend" -name "*migration*" -o -name "*.sql" | head -20
} > "$DIAGNOSTIC_DIR/structure-analysis_$TIMESTAMP.log"

# Phase 1.2: Compilation Errors
log_info "Phase 1.2: Checking compilation errors..."

# Backend compilation check
if [ -d "$PROJECT_ROOT/backend" ]; then
    log_info "Checking Rust compilation..."
    cd "$PROJECT_ROOT/backend"
    cargo check --all-targets > "$DIAGNOSTIC_DIR/rust-compilation_$TIMESTAMP.log" 2>&1 || true
    cargo clippy --all-targets -- -D warnings > "$DIAGNOSTIC_DIR/rust-warnings_$TIMESTAMP.log" 2>&1 || true
fi

# Frontend compilation check
if [ -d "$PROJECT_ROOT/frontend" ]; then
    log_info "Checking TypeScript compilation..."
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        npm run build > "$DIAGNOSTIC_DIR/frontend-build_$TIMESTAMP.log" 2>&1 || true
        npx tsc --noEmit > "$DIAGNOSTIC_DIR/typescript-errors_$TIMESTAMP.log" 2>&1 || true
    fi
fi

# Phase 1.3: Import/Export Analysis
log_info "Phase 1.3: Analyzing imports/exports..."
if [ -d "$PROJECT_ROOT/frontend" ] && command -v npx >/dev/null 2>&1; then
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ] && grep -q "madge" package.json 2>/dev/null; then
        log_info "Checking circular dependencies..."
        npx madge --circular src > "$DIAGNOSTIC_DIR/circular-dependencies_$TIMESTAMP.log" 2>&1 || true
    fi
fi

# Phase 1.4: Database Analysis
log_info "Phase 1.4: Analyzing database..."
if [ -d "$PROJECT_ROOT/backend" ]; then
    cd "$PROJECT_ROOT/backend"
    if command -v sqlx >/dev/null 2>&1; then
        sqlx migrate info > "$DIAGNOSTIC_DIR/migration-status_$TIMESTAMP.log" 2>&1 || true
    fi
fi

# Phase 1.5: Environment & Secrets
log_info "Phase 1.5: Analyzing environment variables..."
{
    echo "=== Environment Variables Analysis ==="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "--- Environment Files Found ---"
    find "$PROJECT_ROOT" -name ".env*" -o -name "*.env" | grep -v node_modules
    echo ""
    echo "--- Potential Hardcoded Secrets (basic check) ---"
    echo "Checking for hardcoded passwords..."
    grep -r "password.*=" "$PROJECT_ROOT/backend/src" "$PROJECT_ROOT/frontend/src" \
        --include="*.rs" --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -v "//" | grep -v "test" | head -20 || echo "No obvious hardcoded passwords found"
} > "$DIAGNOSTIC_DIR/environment-analysis_$TIMESTAMP.log"

# Phase 1.6: Documentation Analysis
log_info "Phase 1.6: Analyzing documentation..."
{
    echo "=== Documentation Analysis ==="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "--- Duplicate Documentation Files (by name) ---"
    find "$PROJECT_ROOT/docs" -name "*.md" -exec basename {} \; | sort | uniq -d
    echo ""
    echo "--- Status/Completion Reports ---"
    find "$PROJECT_ROOT/docs" -name "*STATUS*.md" -o -name "*COMPLETE*.md" -o -name "*REPORT*.md" | head -20
} > "$DIAGNOSTIC_DIR/documentation-analysis_$TIMESTAMP.log"

# Phase 1.7: Code Quality
log_info "Phase 1.7: Analyzing code quality..."
{
    echo "=== Code Quality Analysis ==="
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "--- Potential Duplicate Functions (basic check) ---"
    echo "Rust functions:"
    grep -r "pub fn" "$PROJECT_ROOT/backend/src" --include="*.rs" 2>/dev/null | \
        awk '{print $3}' | sort | uniq -d | head -20 || echo "No obvious duplicates found"
    echo ""
    echo "TypeScript functions:"
    grep -r "export.*function\|export.*const.*=" "$PROJECT_ROOT/frontend/src" \
        --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -E "function|const.*=" | awk '{print $NF}' | sort | uniq -d | head -20 || echo "No obvious duplicates found"
} > "$DIAGNOSTIC_DIR/code-quality_$TIMESTAMP.log"

# Generate summary
log_info "Generating diagnostic summary..."
{
    echo "=== Build Orchestration Diagnostic Summary ==="
    echo "Generated: $(date)"
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "=== Diagnostic Files Generated ==="
    ls -lh "$DIAGNOSTIC_DIR"/*_$TIMESTAMP.log 2>/dev/null | awk '{print $9, "(" $5 ")"}'
    echo ""
    echo "=== Quick Status ==="
    echo ""
    echo "Rust Compilation:"
    if grep -q "error" "$DIAGNOSTIC_DIR/rust-compilation_$TIMESTAMP.log" 2>/dev/null; then
        echo "  ❌ Errors found - check rust-compilation_$TIMESTAMP.log"
    else
        echo "  ✅ No compilation errors"
    fi
    echo ""
    echo "TypeScript Compilation:"
    if grep -q "error" "$DIAGNOSTIC_DIR/typescript-errors_$TIMESTAMP.log" 2>/dev/null; then
        echo "  ❌ Errors found - check typescript-errors_$TIMESTAMP.log"
    else
        echo "  ✅ No compilation errors"
    fi
    echo ""
    echo "Frontend Build:"
    if grep -q "error\|Error" "$DIAGNOSTIC_DIR/frontend-build_$TIMESTAMP.log" 2>/dev/null; then
        echo "  ❌ Build errors found - check frontend-build_$TIMESTAMP.log"
    else
        echo "  ✅ Build successful"
    fi
    echo ""
    echo "=== Next Steps ==="
    echo "1. Review all diagnostic files in: $DIAGNOSTIC_DIR"
    echo "2. Execute fixes based on findings"
    echo "3. Re-run diagnostic after fixes"
    echo "4. See ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md for detailed fix instructions"
} > "$DIAGNOSTIC_DIR/SUMMARY_$TIMESTAMP.md"

log_success "Diagnostic complete!"
log_info "Results saved to: $DIAGNOSTIC_DIR"
log_info "Summary: $DIAGNOSTIC_DIR/SUMMARY_$TIMESTAMP.md"
log_info ""
log_info "Review the diagnostic files and execute fixes using:"
log_info "  docs/operations/ULTIMATE_BUILD_ORCHESTRATION_PROMPT.md"

