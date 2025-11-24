#!/bin/bash
# Enhanced Test Coverage Audit Script
# Provides detailed coverage analysis and recommendations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common-functions.sh"

FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

echo "📊 Enhanced Test Coverage Audit"
echo ""

cd "$SCRIPT_DIR/.."

# Frontend Coverage Analysis
if [ -d "$FRONTEND_DIR" ]; then
    echo "=== Frontend Test Coverage ==="
    cd "$FRONTEND_DIR"
    
    if [ -f "package.json" ]; then
        # Check if test coverage command exists
        if grep -q "\"test:coverage\"" package.json || grep -q "\"test.*coverage\"" package.json; then
            log_info "Running frontend test coverage..."
            npm run test:coverage 2>/dev/null || log_warning "Coverage command failed or not configured"
        else
            log_warning "Test coverage script not found in package.json"
            echo "  Add to package.json:"
            echo "    \"test:coverage\": \"vitest --coverage\""
        fi
        
        # Analyze coverage directory if it exists
        if [ -d "coverage" ]; then
            echo ""
            log_info "Coverage Report Analysis:"
            
            if [ -f "coverage/coverage-summary.json" ]; then
                echo "  Coverage Summary:"
                cat coverage/coverage-summary.json | grep -E '"lines"|"statements"|"functions"|"branches"' | head -4
            fi
            
            if [ -f "coverage/lcov-report/index.html" ]; then
                echo ""
                echo "  📄 Detailed report: frontend/coverage/lcov-report/index.html"
            fi
        fi
        
        # Check for test files
        echo ""
        log_info "Test File Analysis:"
        TEST_COUNT=$(find src -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | wc -l | tr -d ' ')
        echo "  Test files found: $TEST_COUNT"
        
        # Find components without tests
        echo ""
        log_info "Components without tests:"
        find src/components -name "*.tsx" -type f ! -name "*.test.tsx" ! -name "*.stories.tsx" 2>/dev/null | \
            while read -r component; do
                test_file="${component%.tsx}.test.tsx"
                if [ ! -f "$test_file" ]; then
                    echo "    - $component"
                fi
            done | head -10
        
        if [ "$TEST_COUNT" -eq 0 ]; then
            log_warning "No test files found. Consider adding tests."
        fi
    fi
    
    cd ..
fi

# Backend Coverage Analysis
if [ -d "$BACKEND_DIR" ]; then
    echo ""
    echo "=== Backend Test Coverage ==="
    cd "$BACKEND_DIR"
    
    if [ -f "Cargo.toml" ]; then
        # Check if tarpaulin is available
        if command -v cargo-tarpaulin &> /dev/null; then
            log_info "Running backend test coverage..."
            cargo tarpaulin --out Html --output-dir coverage 2>/dev/null || log_warning "Coverage generation failed"
            
            if [ -d "coverage" ]; then
                echo ""
                log_info "Coverage Report:"
                echo "  📄 Report: backend/coverage/tarpaulin-report.html"
            fi
        else
            log_warning "cargo-tarpaulin not found"
            echo "  Install with: cargo install cargo-tarpaulin"
        fi
        
        # Count test files
        echo ""
        log_info "Test File Analysis:"
        TEST_COUNT=$(find src -name "*test*.rs" -o -name "*tests.rs" 2>/dev/null | wc -l | tr -d ' ')
        echo "  Test modules found: $TEST_COUNT"
        
        # Find modules without tests
        echo ""
        log_info "Modules without tests:"
        find src -name "*.rs" -type f ! -name "*test*.rs" ! -name "*tests.rs" 2>/dev/null | \
            while read -r module; do
                # Check if module has #[cfg(test)] mod tests
                if ! grep -q "#\[cfg(test)\]" "$module" 2>/dev/null; then
                    echo "    - $module"
                fi
            done | head -10
    fi
    
    cd ..
fi

# Recommendations
echo ""
echo "=== Recommendations ==="
echo ""
echo "1. Target Coverage:"
echo "   - Critical paths: 100%"
echo "   - Core features: 80%"
echo "   - Utilities: 70%"
echo "   - UI components: 60%"
echo ""
echo "2. Priority Areas:"
echo "   - Authentication flows"
echo "   - Data processing logic"
echo "   - API services"
echo "   - Error handling"
echo ""
echo "3. Test Templates:"
echo "   - Component: frontend/src/__tests__/example-component.test.tsx"
echo "   - Service: frontend/src/__tests__/example-service.test.ts"
echo ""
echo "4. Test Utilities:"
echo "   - frontend/src/utils/testUtils.tsx"
echo ""

log_success "Coverage audit complete!"


