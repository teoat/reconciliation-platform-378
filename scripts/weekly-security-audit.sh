#!/bin/bash
# Weekly Security Audit Script
# Runs comprehensive security checks on frontend and backend

set -e

echo "🔒 Starting Weekly Security Audit..."
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/.."

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# Backend Security Audit
echo "📦 Backend (Rust) Security Audit"
echo "---------------------------------"
cd backend

if command -v cargo >/dev/null 2>&1; then
    echo "Running cargo audit..."
    if cargo audit; then
        print_status 0 "Backend: No vulnerabilities found"
    else
        print_status 1 "Backend: Vulnerabilities detected!"
    fi
else
    echo -e "${YELLOW}⚠️  cargo not found, skipping backend audit${NC}"
fi

cd ..

# Frontend Security Audit  
echo ""
echo "🎨 Frontend (Node.js) Security Audit"
echo "------------------------------------"
cd frontend

if command -v npm >/dev/null 2>&1; then
    echo "Running npm audit..."
    if npm audit --audit-level=high; then
        print_status 0 "Frontend: No high/critical vulnerabilities"
    else
        print_status 1 "Frontend: High/critical vulnerabilities detected!"
    fi
else
    echo -e "${YELLOW}⚠️  npm not found, skipping frontend audit${NC}"
fi

cd ..

# Check for secrets in git history
echo ""
echo "🔑 Checking for exposed secrets..."
echo "----------------------------------"

if command -v git >/dev/null 2>&1; then
    # Check for common secret patterns
    if git grep -iE "(password|api[_-]?key|secret|token|credentials)\\s*=\\s*['\\\"][^'\\\"]+['\\\"]" -- ':!*.md' ':!*.txt' ':!scripts/*' ':!*.example' 2>/dev/null; then
        print_status 1 "Potential secrets found in codebase!"
    else
        print_status 0 "No obvious secrets detected"
    fi
fi

# Summary
echo ""
echo "=================================="
echo "✅ Security Audit Complete!"
echo "=================================="
echo ""
echo "📊 Summary:"
echo "- Backend audit: cargo audit"
echo "- Frontend audit: npm audit"
echo "- Secret scan: git grep patterns"
echo ""
echo "💡 Tip: Run this weekly or integrate into CI/CD"
echo ""
echo "Next steps if vulnerabilities found:"
echo "1. Review audit output above"
echo "2. Update vulnerable dependencies"
echo "3. Run audit again to verify fixes"
echo "4. Document any accepted risks"

