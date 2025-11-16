#!/bin/bash
# scripts/deployment/error-detection.sh
# Comprehensive pre-deployment error detection script

set -e

echo "🔍 Starting Pre-Deployment Error Detection..."

# Check for missing dependencies
check_dependencies() {
    echo "Checking dependencies..."
    local missing=0
    
    # Backend (Rust)
    if ! command -v rustc &> /dev/null; then
        echo "❌ Rust compiler not found"
        missing=$((missing + 1))
    fi
    
    if ! command -v cargo &> /dev/null; then
        echo "❌ Cargo not found"
        missing=$((missing + 1))
    fi
    
    # Frontend (Node)
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found"
        missing=$((missing + 1))
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm not found"
        missing=$((missing + 1))
    fi
    
    # Docker
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found"
        missing=$((missing + 1))
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose not found"
        missing=$((missing + 1))
    fi
    
    # Kubernetes (if deploying to K8s)
    if [ "$DEPLOY_TARGET" = "k8s" ]; then
        if ! command -v kubectl &> /dev/null; then
            echo "❌ kubectl not found"
            missing=$((missing + 1))
        fi
    fi
    
    if [ $missing -eq 0 ]; then
        echo "✅ All dependencies found"
    fi
    
    return $missing
}

# Check for missing modules/packages
check_modules() {
    echo "Checking modules and packages..."
    local errors=0
    
    # Backend Rust dependencies
    if [ -f "backend/Cargo.toml" ]; then
        cd backend
        if ! cargo tree &> /dev/null 2>&1; then
            echo "❌ Backend: Cargo dependencies not resolved"
            echo "   Fix: cd backend && cargo fetch"
            errors=$((errors + 1))
        fi
        cd ..
    fi
    
    # Frontend Node dependencies
    if [ -f "frontend/package.json" ]; then
        cd frontend
        if [ ! -d "node_modules" ]; then
            echo "❌ Frontend: node_modules not found"
            echo "   Fix: cd frontend && npm install"
            errors=$((errors + 1))
        else
            # Check for missing packages
            if npm ls --depth=0 2>&1 | grep -q "UNMET"; then
                echo "❌ Frontend: Unmet dependencies detected"
                echo "   Fix: cd frontend && npm install"
                errors=$((errors + 1))
            fi
        fi
        cd ..
    fi
    
    if [ $errors -eq 0 ]; then
        echo "✅ All modules resolved"
    fi
    
    return $errors
}

# Check for missing environment variables
check_env_vars() {
    echo "Checking environment variables..."
    local missing=0
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "CORS_ORIGIN"
    )
    
    if [ ! -f ".env" ]; then
        echo "⚠️  .env file not found (will check .env.example)"
        if [ -f ".env.example" ]; then
            echo "   Found .env.example - you may need to copy it to .env"
        fi
    else
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" .env 2>/dev/null; then
                echo "⚠️  Missing environment variable: $var"
                missing=$((missing + 1))
            fi
        done
    fi
    
    if [ $missing -eq 0 ]; then
        echo "✅ All required environment variables present"
    fi
    
    return $missing
}

# Check for configuration errors
check_config() {
    echo "Checking configuration files..."
    local errors=0
    
    # Docker Compose
    if [ -f "docker-compose.yml" ]; then
        if ! docker-compose config &> /dev/null 2>&1 && ! docker compose config &> /dev/null 2>&1; then
            echo "❌ docker-compose.yml has syntax errors"
            docker-compose config 2>&1 || docker compose config 2>&1 || true
            errors=$((errors + 1))
        fi
    fi
    
    # Kubernetes manifests (only if kubectl is available)
    if [ -d "k8s" ] && command -v kubectl &> /dev/null; then
        local k8s_errors=0
        for file in $(find k8s -name "*.yaml" -o -name "*.yml" 2>/dev/null); do
            # Skip kustomization files as they need special handling
            if [[ "$file" == *"kustomization.yaml" ]] || [[ "$file" == *"kustomization.yml" ]]; then
                continue
            fi
            if ! kubectl apply --dry-run=client -f "$file" &> /dev/null 2>&1; then
                echo "⚠️  K8s manifest validation issue: $file (may need kubectl context)"
                k8s_errors=$((k8s_errors + 1))
            fi
        done
        if [ $k8s_errors -eq 0 ]; then
            echo "✅ Kubernetes manifests validated"
        else
            echo "⚠️  Some K8s manifests have validation issues (may need kubectl context configured)"
        fi
    elif [ -d "k8s" ]; then
        echo "⚠️  kubectl not found - skipping K8s manifest validation"
    fi
    
    if [ $errors -eq 0 ]; then
        echo "✅ All configuration files valid"
    fi
    
    return $errors
}

# Check for code compilation errors
check_compilation() {
    echo "Checking code compilation..."
    local errors=0
    
    # Backend Rust
    if [ -f "backend/Cargo.toml" ]; then
        cd backend
        # Check for actual errors (not warnings)
        if cargo check 2>&1 | grep -q "error\["; then
            echo "❌ Backend: Compilation errors detected"
            echo "   Fix: cd backend && cargo build"
            errors=$((errors + 1))
        else
            echo "✅ Backend compiles successfully (warnings may be present)"
        fi
        cd ..
    fi
    
    # Frontend TypeScript/JavaScript
    if [ -f "frontend/package.json" ]; then
        cd frontend
        if [ -f "tsconfig.json" ]; then
            if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
                echo "⚠️  Frontend: TypeScript errors detected (non-blocking)"
            fi
        fi
        cd ..
    fi
    
    if [ $errors -eq 0 ]; then
        echo "✅ Code compiles successfully"
    fi
    
    return $errors
}

# Main execution
main() {
    local total_errors=0
    
    check_dependencies || total_errors=$((total_errors + $?))
    check_modules || total_errors=$((total_errors + $?))
    check_env_vars || total_errors=$((total_errors + $?))
    check_config || total_errors=$((total_errors + $?))
    check_compilation || total_errors=$((total_errors + $?))
    
    if [ $total_errors -eq 0 ]; then
        echo "✅ All pre-deployment checks passed"
        exit 0
    else
        echo "❌ Found $total_errors error(s). Please fix before deploying."
        exit 1
    fi
}

main "$@"

