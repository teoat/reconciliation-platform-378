#!/bin/bash
# scripts/deployment/check-backend.sh
# Backend (Rust) service health check

set -e

check_backend() {
    echo "🔍 Checking Backend Service..."
    
    # Check if backend directory exists
    if [ ! -d "backend" ]; then
        echo "❌ Backend directory not found"
        return 1
    fi
    
    cd backend
    
    # Check for missing Rust crates
    if ! cargo tree --depth 1 &> /dev/null 2>&1; then
        echo "❌ Missing Rust dependencies"
        echo "   Fix: cargo fetch && cargo build"
        cd ..
        return 1
    fi
    
    # Check for compilation errors
    if ! cargo check --all-targets &> /dev/null 2>&1; then
        echo "❌ Compilation errors found"
        echo "   Run: cargo check --all-targets"
        cd ..
        return 1
    fi
    
    # Check for missing environment variables
    local required=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
    local missing_vars=0
    
    for var in "${required[@]}"; do
        if [ -z "${!var}" ] && ! grep -q "^${var}=" ../.env 2>/dev/null; then
            echo "⚠️  Missing environment variable: $var"
            missing_vars=$((missing_vars + 1))
        fi
    done
    
    if [ $missing_vars -gt 0 ]; then
        echo "⚠️  Some environment variables are missing (non-blocking)"
    fi
    
    cd ..
    echo "✅ Backend checks passed"
    return 0
}

check_backend "$@"

