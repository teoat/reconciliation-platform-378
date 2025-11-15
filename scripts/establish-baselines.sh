#!/bin/bash
# Establish Baselines Script
# Runs all baseline establishment commands

set -e

echo "📊 Establishing Baselines..."
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this script from the project root."
  exit 1
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
BASELINES_DIR=".baselines"
mkdir -p "$BASELINES_DIR"

echo "Timestamp: $TIMESTAMP"
echo ""

# 1. Coverage Baseline
echo "📊 Step 1: Coverage Baseline"
echo "--------------------------------"
if command -v npm >/dev/null 2>&1; then
  echo "Running frontend test coverage..."
  if npm run test:coverage 2>/dev/null; then
    echo "✅ Frontend coverage baseline created"
    npm run coverage:check > "$BASELINES_DIR/coverage-frontend.txt" 2>&1 || true
  else
    echo "⚠️  Frontend coverage not available (tests may need setup)"
  fi
else
  echo "⚠️  npm not found, skipping frontend coverage"
fi

echo ""

# Check for backend
if [ -d "backend" ] && command -v cargo >/dev/null 2>&1; then
  echo "Running backend test coverage..."
  cd backend
  if command -v cargo-tarpaulin >/dev/null 2>&1; then
    if cargo tarpaulin --out Html --output-dir coverage 2>/dev/null; then
      echo "✅ Backend coverage baseline created"
    else
      echo "⚠️  Backend coverage generation failed (dependencies may need setup)"
    fi
  else
    echo "⚠️  cargo-tarpaulin not installed. Install with: cargo install cargo-tarpaulin"
  fi
  cd ..
else
  echo "⚠️  Backend or cargo not found, skipping backend coverage"
fi

echo ""

# 2. Bundle Baseline
echo "📦 Step 2: Bundle Baseline"
echo "--------------------------------"
if command -v npm >/dev/null 2>&1; then
  echo "Building project for bundle analysis..."
  if npm run build >/dev/null 2>&1; then
    echo "✅ Build completed"
    if npm run bundle:monitor:baseline 2>/dev/null; then
      echo "✅ Bundle baseline created"
    else
      echo "⚠️  Bundle baseline creation failed"
    fi
  else
    echo "⚠️  Build failed, skipping bundle baseline"
  fi
else
  echo "⚠️  npm not found, skipping bundle baseline"
fi

echo ""

# 3. Performance Baseline
echo "⚡ Step 3: Performance Baseline"
echo "--------------------------------"
if command -v npm >/dev/null 2>&1; then
  if npm run performance:baseline 2>/dev/null; then
    echo "✅ Performance baseline created"
  else
    echo "⚠️  Performance baseline creation failed (may need environment setup)"
  fi
else
  echo "⚠️  npm not found, skipping performance baseline"
fi

echo ""

# 4. Generate Summary
echo "📋 Step 4: Generating Baseline Summary"
echo "--------------------------------"
cat > "$BASELINES_DIR/BASELINE_SUMMARY.md" <<EOF
# Baseline Establishment Summary

**Generated**: $TIMESTAMP

---

## Baselines Established

### Coverage Baseline
- **Frontend**: $(if [ -f "coverage/lcov.info" ] || [ -f "frontend/coverage/lcov.info" ]; then echo "✅ Created"; else echo "⚠️  Not available"; fi)
- **Backend**: $(if [ -d "backend/coverage" ]; then echo "✅ Created"; else echo "⚠️  Not available"; fi)

### Bundle Baseline
- **Status**: $(if [ -f ".bundle-baseline.json" ]; then echo "✅ Created"; else echo "⚠️  Not available"; fi)

### Performance Baseline
- **Status**: $(if [ -d "performance-results" ] && [ -f "performance-results/baseline.json" ]; then echo "✅ Created"; else echo "⚠️  Not available"; fi)

---

## Next Steps

1. Review baseline reports
2. Compare against targets
3. Create improvement plan
4. Execute improvements

---

**Report Generated**: $TIMESTAMP

EOF

echo "✅ Baseline summary created: $BASELINES_DIR/BASELINE_SUMMARY.md"
echo ""

echo "================================"
echo "✅ Baseline Establishment Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Review baseline reports"
echo "2. Run: npm run quality:check"
echo "3. Review generated reports"
echo "4. Start execution phase"

