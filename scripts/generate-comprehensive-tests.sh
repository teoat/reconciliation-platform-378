#!/bin/bash
# Generate comprehensive tests for 100% coverage
# This script helps identify and generate tests for untested code

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Analyzing codebase for test coverage gaps..."

# Count total functions
echo "📊 Counting functions..."
TOTAL_FUNCTIONS=$(find "$PROJECT_ROOT/backend/src" -name "*.rs" -type f -exec grep -h "pub fn\|pub async fn" {} \; | wc -l | tr -d ' ')
echo "   Total functions: $TOTAL_FUNCTIONS"

# Count test files
echo "📊 Counting test files..."
TOTAL_TEST_FILES=$(find "$PROJECT_ROOT/backend/tests" -name "*test*.rs" -type f | wc -l | tr -d ' ')
echo "   Total test files: $TOTAL_TEST_FILES"

# Count test functions
echo "📊 Counting test functions..."
TOTAL_TESTS=$(find "$PROJECT_ROOT/backend/tests" -name "*test*.rs" -type f -exec grep -h "#\[test\]\|#\[tokio::test\]" {} \; | wc -l | tr -d ' ')
echo "   Total tests: $TOTAL_TESTS"

# Find services without tests
echo "🔍 Finding services without comprehensive tests..."
SERVICES=$(find "$PROJECT_ROOT/backend/src/services" -name "*.rs" -type f -not -name "mod.rs" | sed 's|.*/||' | sed 's|\.rs||' | sort -u)

for service in $SERVICES; do
    TEST_FILE="$PROJECT_ROOT/backend/tests/${service}_tests.rs"
    if [ ! -f "$TEST_FILE" ]; then
        echo "   ⚠️  Missing: ${service}_tests.rs"
    fi
done

echo ""
echo "✅ Analysis complete!"
echo ""
echo "📈 Coverage Summary:"
echo "   Functions: $TOTAL_FUNCTIONS"
echo "   Test Files: $TOTAL_TEST_FILES"
echo "   Tests: $TOTAL_TESTS"
echo ""
echo "🎯 Next Steps:"
echo "   1. Expand existing service tests"
echo "   2. Create missing service tests"
echo "   3. Add frontend component tests"
echo "   4. Add frontend hook/utility tests"
echo "   5. Verify 100% coverage"

