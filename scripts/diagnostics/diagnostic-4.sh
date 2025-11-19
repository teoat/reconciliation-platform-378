#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 4: Performance & Optimization
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-4-results.json}"

log_info "Starting Performance & Optimization Analysis..."

# Initialize results
echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    local name=$1
    local status=$2
    local message=$3
    local details=$4
    
    jq --arg name "$name" --arg status "$status" --arg msg "$message" --arg details "$details" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Check bundle size
log_info "Analyzing frontend bundle size..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if [ -d "dist" ]; then
        BUNDLE_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
        JS_SIZE=$(find dist -name "*.js" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
        CSS_SIZE=$(find dist -name "*.css" -exec du -ch {} + 2>/dev/null | tail -1 | cut -f1)
        
        log_info "Bundle size: $BUNDLE_SIZE (JS: $JS_SIZE, CSS: $CSS_SIZE)"
        add_check "bundle_size" "success" "Bundle analyzed" "Total: $BUNDLE_SIZE, JS: $JS_SIZE, CSS: $CSS_SIZE"
    else
        log_warning "No dist directory found, run build first"
        add_check "bundle_size" "warning" "No build artifacts" "Run 'npm run build' first"
    fi
    cd ..
fi

# 2. Check for large images
log_info "Checking for large images..."
LARGE_IMAGES=$(find frontend/public frontend/src -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) \
    -size +500k 2>/dev/null | wc -l | tr -d ' ')

if [ "$LARGE_IMAGES" -gt 0 ]; then
    log_warning "Found $LARGE_IMAGES large images (>500KB)"
    add_check "large_images" "warning" "$LARGE_IMAGES large images found" "Consider optimization"
else
    log_success "No large images detected"
    add_check "large_images" "success" "No large images" ""
fi

# 3. Check database indexes (if database is accessible)
log_info "Checking database indexes..."
if docker ps --format "{{.Names}}" | grep -q "reconciliation-postgres"; then
    MISSING_INDEXES=$(docker exec reconciliation-postgres psql -U postgres -d reconciliation_app -tAc \
        "SELECT COUNT(*) FROM pg_stat_user_tables WHERE seq_scan > idx_scan AND seq_scan > 100;" 2>/dev/null || echo "0")
    
    if [ "$MISSING_INDEXES" -gt 0 ]; then
        log_warning "Found $MISSING_INDEXES tables with missing indexes"
        add_check "database_indexes" "warning" "$MISSING_INDEXES tables need indexes" ""
    else
        log_success "Database indexes look good"
        add_check "database_indexes" "success" "Indexes adequate" ""
    fi
else
    log_info "Database not accessible, skipping index check"
    add_check "database_indexes" "info" "Database not accessible" ""
fi

# 4. Check for N+1 query patterns (code analysis)
log_info "Checking for N+1 query patterns..."
N1_PATTERNS=$(grep -r "for.*in\|\.map\|\.forEach" --include="*.rs" backend/src 2>/dev/null | \
    grep -E "(get_|find_|query)" | wc -l | tr -d ' ')

if [ "$N1_PATTERNS" -gt 5 ]; then
    log_warning "Found potential N+1 query patterns"
    add_check "n1_queries" "warning" "Potential N+1 patterns found" "Review query patterns"
else
    log_success "No obvious N+1 patterns detected"
    add_check "n1_queries" "success" "No patterns found" ""
fi

# 5. Check backend compilation performance
log_info "Checking backend compilation..."
if [ -f "backend/Cargo.toml" ]; then
    cd backend
    if cargo check --message-format=json 2>&1 | jq -r 'select(.message != null) | select(.message.level == "error")' | head -1 > /dev/null 2>&1; then
        log_warning "Backend has compilation errors"
        add_check "backend_compilation" "error" "Compilation errors found" ""
    else
        log_success "Backend compiles successfully"
        add_check "backend_compilation" "success" "Compiles successfully" ""
    fi
    cd ..
fi

# 6. Check frontend build performance
log_info "Checking frontend build..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if [ -f "dist/index.html" ]; then
        log_success "Frontend build exists"
        add_check "frontend_build" "success" "Build artifacts found" ""
    else
        log_warning "Frontend not built"
        add_check "frontend_build" "warning" "No build artifacts" ""
    fi
    cd ..
fi

# 7. Check for console.log in production code
log_info "Checking for console.log in production code..."
CONSOLE_LOGS=$(grep -r "console\.log\|console\.warn\|console\.error" \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    frontend/src 2>/dev/null | grep -v "test\|spec" | wc -l | tr -d ' ')

if [ "$CONSOLE_LOGS" -gt 0 ]; then
    log_warning "Found $CONSOLE_LOGS console statements"
    add_check "console_logs" "warning" "$CONSOLE_LOGS console statements" "Remove for production"
else
    log_success "No console statements in production code"
    add_check "console_logs" "success" "No console statements" ""
fi

log_success "Performance & Optimization Analysis complete"
cat "$RESULTS_FILE" | jq '.'

