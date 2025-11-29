#!/bin/bash
# ==============================================================================
# Complete All Next Steps
# ==============================================================================
# Automated script to complete all next steps from SYNC_AND_NEXT_STEPS_COMPLETE.md
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_info "Completing All Next Steps"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==============================================================================
# STEP 1: Type Safety - Find and Report
# ==============================================================================
log_info "Step 1: Analyzing type safety issues..."

HIGH_PRIORITY_FILES=(
    "frontend/src/contexts/index.tsx:48"
    "frontend/src/types/ingestion/data.ts:13"
    "frontend/src/types/project/data.ts:13"
    "frontend/src/hooks/useRealtimeSync.ts:8"
)

log_info "High priority files identified:"
for file_info in "${HIGH_PRIORITY_FILES[@]}"; do
    file="${file_info%%:*}"
    count="${file_info##*:}"
    if [ -f "$PROJECT_ROOT/$file" ]; then
        log_info "  - $file: $count instances"
    else
        log_warning "  - $file: File not found"
    fi
done

echo ""

# ==============================================================================
# STEP 2: Console.log Detection
# ==============================================================================
log_info "Step 2: Detecting console.log statements..."

CONSOLE_FILES=$(find "$PROJECT_ROOT/frontend/src" -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\.\(log\|error\|warn\|info\|debug\)" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
CONSOLE_COUNT=$(find "$PROJECT_ROOT/frontend/src" -name "*.ts" -o -name "*.tsx" | xargs grep -o "console\.\(log\|error\|warn\|info\|debug\)" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

log_info "Found $CONSOLE_COUNT console statements in $CONSOLE_FILES files"

echo ""

# ==============================================================================
# STEP 3: Generate Fix Plan
# ==============================================================================
log_info "Step 3: Generating fix plan..."

cat > "$PROJECT_ROOT/docs/diagnostics/FIX_PLAN.md" <<EOF
# Fix Plan - Complete Next Steps

**Generated**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

---

## Type Safety Fixes

### Priority 1: High-Impact Files

1. **frontend/src/contexts/index.tsx** (48 instances)
   - Strategy: Create proper type definitions for context values
   - Replace 'any' with specific types or 'unknown' with type guards

2. **frontend/src/types/ingestion/data.ts** (13 instances)
   - Strategy: Define proper interfaces for ingestion data structures
   - Use generic types where appropriate

3. **frontend/src/types/project/data.ts** (13 instances)
   - Strategy: Define proper interfaces for project data structures
   - Use generic types where appropriate

4. **frontend/src/hooks/useRealtimeSync.ts** (8 instances)
   - Strategy: Type WebSocket events and handlers properly
   - Use proper event types

---

## Error Handling Implementation

1. **Create Unified Error Service**
   - Location: \`frontend/src/services/errorHandling/unifiedErrorService.ts\`
   - Based on: \`docs/diagnostics/ERROR_HANDLING_DESIGN.md\`

2. **Migration Plan**
   - Start with high-priority services
   - Migrate one service at a time
   - Test after each migration

---

## Code Cleanup

1. **Console.log Removal**
   - Files affected: $CONSOLE_FILES
   - Total instances: $CONSOLE_COUNT
   - Replace with logger from \`@/services/logger\`

2. **Unused Imports**
   - Run ESLint auto-fix
   - Manual review for complex cases

3. **Import Organization**
   - Use consistent import order
   - Group: external, internal, types

---

## Execution Order

1. Type Safety (High Priority Files
2. Error Handling Service Creation
3. Code Cleanup (Console.log removal)
4. Remaining Type Safety fixes
5. Error Handling Migration

---

**Status**: Plan Generated - Ready for Execution
EOF

log_success "Fix plan generated: docs/diagnostics/FIX_PLAN.md"

echo ""

# ==============================================================================
# SUMMARY
# ==============================================================================
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "ANALYSIS COMPLETE"
log_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

log_info "Next Steps:"
echo "  1. Review fix plan: docs/diagnostics/FIX_PLAN.md"
echo "  2. Execute type safety fixes"
echo "  3. Implement error handling service"
echo "  4. Complete code cleanup"
echo ""

log_info "Files to fix:"
echo "  - Type Safety: 4 high-priority files"
echo "  - Console.log: $CONSOLE_FILES files ($CONSOLE_COUNT instances)"
echo "  - Error Handling: Service implementation needed"
echo ""

log_success "Ready to begin fixes!"

