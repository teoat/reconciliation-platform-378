#!/bin/bash
# scripts/deployment/check-frontend.sh
# Frontend (React/Vite) service health check

set -e

check_frontend() {
    echo "🔍 Checking Frontend Service..."
    
    # Check if frontend directory exists
    if [ ! -d "frontend" ]; then
        echo "❌ Frontend directory not found"
        return 1
    fi
    
    cd frontend
    
    # Check for missing npm packages
    if [ ! -d "node_modules" ]; then
        echo "❌ node_modules not found"
        echo "   Fix: npm install"
        cd ..
        return 1
    fi
    
    # Check for unmet dependencies
    if npm ls --depth=0 2>&1 | grep -q "UNMET"; then
        echo "❌ Unmet dependencies"
        echo "   Fix: npm install"
        cd ..
        return 1
    fi
    
    # Check for build errors (non-blocking)
    if [ -f "package.json" ]; then
        if grep -q '"build"' package.json; then
            if ! npm run build &> /dev/null 2>&1; then
                echo "⚠️  Build errors detected (non-blocking)"
            fi
        fi
    fi
    
    # Check for missing environment variables
    if [ -z "$VITE_API_URL" ] && ! grep -q "VITE_API_URL" ../.env 2>/dev/null; then
        echo "⚠️  VITE_API_URL not set (using default)"
    fi
    
    cd ..
    echo "✅ Frontend checks passed"
    return 0
}

check_frontend "$@"

