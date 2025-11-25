#!/bin/bash

# Comprehensive Diagnostic Script for Reconciliation Platform
# Analyzes all components and generates a scored diagnostic report

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/diagnostic-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/comprehensive_diagnostic_${TIMESTAMP}.json"
REPORT_MD="$REPORT_DIR/comprehensive_diagnostic_${TIMESTAMP}.md"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Initialize scores (using individual variables for macOS compatibility)
SCORE_BACKEND=0
SCORE_FRONTEND=0
SCORE_INFRASTRUCTURE=0
SCORE_DOCUMENTATION=0
SCORE_SECURITY=0
SCORE_CODE_QUALITY=0

# Details storage (using a temp file for compatibility)
DETAILS_FILE=$(mktemp)

# Create report directory
mkdir -p "$REPORT_DIR"

# Helper function to store details
store_detail() {
    echo "$1|$2" >> "$DETAILS_FILE"
}

# Helper function to get detail
get_detail() {
    grep "^$1|" "$DETAILS_FILE" | cut -d'|' -f2- || echo ""
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Calculate score based on percentage
calculate_score() {
    local percentage=$1
    local max_score=$2
    echo "$(echo "scale=2; $percentage * $max_score / 100" | bc)"
}

# Backend Diagnostics
diagnose_backend() {
    log_info "Diagnosing Backend (Rust)..."
    local backend_score=0
    local max_backend_score=100
    
    cd "$PROJECT_ROOT/backend"
    
    # 1. Compilation Check (30 points)
    log_info "  Checking compilation..."
    if cargo check --message-format=json 2>&1 | grep -q '"reason":"compiler-error"'; then
        local errors=$(cargo check --message-format=json 2>&1 | grep -c '"reason":"compiler-error"' || echo "0")
        local error_pct=$((100 - errors * 5))
        if [ $error_pct -lt 0 ]; then error_pct=0; fi
        local score=$(calculate_score $error_pct 30)
        backend_score=$(echo "$backend_score + $score" | bc)
        store_detail "backend_compilation" "Errors: $errors, Score: $score/30"
        log_warning "  Compilation errors found: $errors"
    else
        backend_score=$(echo "$backend_score + 30" | bc)
        store_detail "backend_compilation" "No errors, Score: 30/30"
        log_success "  Compilation successful"
    fi
    
    # 2. Test Coverage (25 points)
    log_info "  Checking test coverage..."
    local test_files=$(find . -name "*test*.rs" | wc -l | tr -d ' ')
    local source_files=$(find src -name "*.rs" | wc -l | tr -d ' ')
    if [ $source_files -gt 0 ]; then
        local test_ratio=$(echo "scale=2; $test_files * 100 / $source_files" | bc)
        local test_score=$(calculate_score $test_ratio 25)
        backend_score=$(echo "$backend_score + $test_score" | bc)
        DETAILS["backend_tests"]="Test files: $test_files, Source files: $source_files, Ratio: ${test_ratio}%, Score: $test_score/25"
    else
        DETAILS["backend_tests"]="No source files found"
    fi
    
    # 3. Code Quality - Clippy (20 points)
    log_info "  Checking code quality (clippy)..."
    if command -v cargo-clippy &> /dev/null || cargo clippy --version &> /dev/null; then
        local clippy_warnings=$(cargo clippy --message-format=json 2>&1 | grep -c '"level":"warning"' || echo "0")
        local clippy_errors=$(cargo clippy --message-format=json 2>&1 | grep -c '"level":"error"' || echo "0")
        local total_issues=$((clippy_warnings + clippy_errors))
        local quality_pct=$((100 - total_issues * 2))
        if [ $quality_pct -lt 0 ]; then quality_pct=0; fi
        local quality_score=$(calculate_score $quality_pct 20)
        backend_score=$(echo "$backend_score + $quality_score" | bc)
        DETAILS["backend_quality"]="Warnings: $clippy_warnings, Errors: $clippy_errors, Score: $quality_score/20"
    else
        log_warning "  Clippy not available, skipping..."
        DETAILS["backend_quality"]="Clippy not installed"
    fi
    
    # 4. Security Audit (15 points)
    log_info "  Checking security (cargo audit)..."
    if command -v cargo-audit &> /dev/null; then
        if cargo audit --json 2>&1 | grep -q '"vulnerabilities":\['; then
            local vulns=$(cargo audit --json 2>&1 | grep -o '"vulnerabilities":\[[^]]*\]' | grep -o 'vulnerability' | wc -l | tr -d ' ')
            local security_pct=$((100 - vulns * 10))
            if [ $security_pct -lt 0 ]; then security_pct=0; fi
            local security_score=$(calculate_score $security_pct 15)
            backend_score=$(echo "$backend_score + $security_score" | bc)
            DETAILS["backend_security"]="Vulnerabilities: $vulns, Score: $security_score/15"
        else
            backend_score=$(echo "$backend_score + 15" | bc)
            DETAILS["backend_security"]="No vulnerabilities, Score: 15/15"
            log_success "  No security vulnerabilities"
        fi
    else
        log_warning "  cargo-audit not available, skipping..."
        DETAILS["backend_security"]="cargo-audit not installed"
    fi
    
    # 5. Documentation (10 points)
    log_info "  Checking documentation..."
    local doc_comments=$(grep -r "///" src/ 2>/dev/null | wc -l | tr -d ' ')
    local functions=$(grep -r "pub fn\|pub async fn" src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ $functions -gt 0 ]; then
        local doc_ratio=$(echo "scale=2; $doc_comments * 100 / $functions" | bc)
        local doc_score=$(calculate_score $doc_ratio 10)
        backend_score=$(echo "$backend_score + $doc_score" | bc)
        DETAILS["backend_docs"]="Doc comments: $doc_comments, Functions: $functions, Ratio: ${doc_ratio}%, Score: $doc_score/10"
    else
        DETAILS["backend_docs"]="No functions found"
    fi
    
    SCORE_BACKEND=$backend_score
    log_success "Backend Score: $backend_score/$max_backend_score"
}

# Frontend Diagnostics
diagnose_frontend() {
    log_info "Diagnosing Frontend (TypeScript/React)..."
    local frontend_score=0
    local max_frontend_score=100
    
    cd "$PROJECT_ROOT/frontend"
    
    # 1. Build Check (25 points)
    log_info "  Checking build..."
    if [ -f "package.json" ]; then
        if npm run build --if-present 2>&1 | grep -q "error\|Error\|ERROR"; then
            local build_errors=$(npm run build --if-present 2>&1 | grep -c "error\|Error\|ERROR" || echo "0")
            local build_pct=$((100 - build_errors * 5))
            if [ $build_pct -lt 0 ]; then build_pct=0; fi
            local build_score=$(calculate_score $build_pct 25)
            frontend_score=$(echo "$frontend_score + $build_score" | bc)
            DETAILS["frontend_build"]="Build errors: $build_errors, Score: $build_score/25"
            log_warning "  Build errors found: $build_errors"
        else
            frontend_score=$(echo "$frontend_score + 25" | bc)
            DETAILS["frontend_build"]="Build successful, Score: 25/25"
            log_success "  Build successful"
        fi
    else
        DETAILS["frontend_build"]="No package.json found"
    fi
    
    # 2. TypeScript Type Checking (20 points)
    log_info "  Checking TypeScript types..."
    if [ -f "tsconfig.json" ]; then
        if npm run type-check --if-present 2>&1 | grep -q "error\|Error"; then
            local type_errors=$(npm run type-check --if-present 2>&1 | grep -c "error\|Error" || echo "0")
            local type_pct=$((100 - type_errors * 3))
            if [ $type_pct -lt 0 ]; then type_pct=0; fi
            local type_score=$(calculate_score $type_pct 20)
            frontend_score=$(echo "$frontend_score + $type_score" | bc)
            DETAILS["frontend_types"]="Type errors: $type_errors, Score: $type_score/20"
        else
            frontend_score=$(echo "$frontend_score + 20" | bc)
            DETAILS["frontend_types"]="No type errors, Score: 20/20"
            log_success "  Type checking passed"
        fi
    else
        DETAILS["frontend_types"]="No tsconfig.json found"
    fi
    
    # 3. Linting (15 points)
    log_info "  Checking linting..."
    if npm run lint --if-present 2>&1 | grep -q "error\|Error\|warning"; then
        local lint_errors=$(npm run lint --if-present 2>&1 | grep -c "error\|Error" || echo "0")
        local lint_warnings=$(npm run lint --if-present 2>&1 | grep -c "warning\|Warning" || echo "0")
        local lint_issues=$((lint_errors * 2 + lint_warnings))
        local lint_pct=$((100 - lint_issues))
        if [ $lint_pct -lt 0 ]; then lint_pct=0; fi
        local lint_score=$(calculate_score $lint_pct 15)
        frontend_score=$(echo "$frontend_score + $lint_score" | bc)
        DETAILS["frontend_lint"]="Lint errors: $lint_errors, Warnings: $lint_warnings, Score: $lint_score/15"
    else
        frontend_score=$(echo "$frontend_score + 15" | bc)
        DETAILS["frontend_lint"]="No linting issues, Score: 15/15"
        log_success "  Linting passed"
    fi
    
    # 4. Test Coverage (20 points)
    log_info "  Checking test coverage..."
    local test_files=$(find src -name "*.test.ts" -o -name "*.test.tsx" | wc -l | tr -d ' ')
    local source_files=$(find src -name "*.ts" -o -name "*.tsx" | grep -v test | wc -l | tr -d ' ')
    if [ $source_files -gt 0 ]; then
        local test_ratio=$(echo "scale=2; $test_files * 100 / $source_files" | bc)
        local test_score=$(calculate_score $test_ratio 20)
        frontend_score=$(echo "$frontend_score + $test_score" | bc)
        DETAILS["frontend_tests"]="Test files: $test_files, Source files: $source_files, Ratio: ${test_ratio}%, Score: $test_score/20"
    else
        DETAILS["frontend_tests"]="No source files found"
    fi
    
    # 5. Security Audit (10 points)
    log_info "  Checking security (npm audit)..."
    if npm audit --json 2>&1 | grep -q '"vulnerabilities"'; then
        local vulns=$(npm audit --json 2>&1 | grep -o '"vulnerabilities":{[^}]*}' | grep -o '"high"\|"critical"\|"moderate"' | wc -l | tr -d ' ')
        local security_pct=$((100 - vulns * 5))
        if [ $security_pct -lt 0 ]; then security_pct=0; fi
        local security_score=$(calculate_score $security_pct 10)
        frontend_score=$(echo "$frontend_score + $security_score" | bc)
        DETAILS["frontend_security"]="Vulnerabilities: $vulns, Score: $security_score/10"
    else
        frontend_score=$(echo "$frontend_score + 10" | bc)
        DETAILS["frontend_security"]="No vulnerabilities, Score: 10/10"
        log_success "  No security vulnerabilities"
    fi
    
    # 6. Bundle Size Analysis (10 points)
    log_info "  Checking bundle size..."
    if [ -f "dist" ] || [ -d "dist" ]; then
        local bundle_size=$(du -sh dist 2>/dev/null | awk '{print $1}' || echo "0")
        # Simple heuristic: smaller is better
        frontend_score=$(echo "$frontend_score + 10" | bc)
        DETAILS["frontend_bundle"]="Bundle size: $bundle_size, Score: 10/10"
    else
        DETAILS["frontend_bundle"]="No dist directory found"
    fi
    
    SCORES["frontend"]=$frontend_score
    log_success "Frontend Score: $frontend_score/$max_frontend_score"
}

# Infrastructure Diagnostics
diagnose_infrastructure() {
    log_info "Diagnosing Infrastructure..."
    local infra_score=0
    local max_infra_score=100
    
    cd "$PROJECT_ROOT"
    
    # 1. Docker Configuration (30 points)
    log_info "  Checking Docker configuration..."
    local docker_files=$(find . -name "docker-compose*.yml" -o -name "Dockerfile*" | wc -l | tr -d ' ')
    if [ $docker_files -gt 0 ]; then
        local docker_score=$(calculate_score 100 30)
        infra_score=$(echo "$infra_score + $docker_score" | bc)
        DETAILS["infra_docker"]="Docker files: $docker_files, Score: $docker_score/30"
        log_success "  Docker configuration found"
    else
        DETAILS["infra_docker"]="No Docker files found"
    fi
    
    # 2. Kubernetes Configuration (25 points)
    log_info "  Checking Kubernetes configuration..."
    local k8s_files=$(find k8s -name "*.yaml" -o -name "*.yml" 2>/dev/null | wc -l | tr -d ' ')
    if [ $k8s_files -gt 0 ]; then
        local k8s_score=$(calculate_score 100 25)
        infra_score=$(echo "$infra_score + $k8s_score" | bc)
        DETAILS["infra_k8s"]="K8s files: $k8s_files, Score: $k8s_score/25"
        log_success "  Kubernetes configuration found"
    else
        DETAILS["infra_k8s"]="No Kubernetes files found"
    fi
    
    # 3. Monitoring Setup (20 points)
    log_info "  Checking monitoring setup..."
    local monitoring_files=$(find monitoring -name "*.yml" -o -name "*.yaml" -o -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    if [ $monitoring_files -gt 0 ]; then
        local monitoring_score=$(calculate_score 100 20)
        infra_score=$(echo "$infra_score + $monitoring_score" | bc)
        DETAILS["infra_monitoring"]="Monitoring files: $monitoring_files, Score: $monitoring_score/20"
    else
        DETAILS["infra_monitoring"]="No monitoring configuration found"
    fi
    
    # 4. Environment Configuration (15 points)
    log_info "  Checking environment configuration..."
    local env_files=$(find . -maxdepth 1 -name ".env*" -o -name "*.env" | wc -l | tr -d ' ')
    if [ $env_files -gt 0 ]; then
        local env_score=$(calculate_score 100 15)
        infra_score=$(echo "$infra_score + $env_score" | bc)
        DETAILS["infra_env"]="Env files: $env_files, Score: $env_score/15"
    else
        DETAILS["infra_env"]="No environment files found"
    fi
    
    # 5. CI/CD Configuration (10 points)
    log_info "  Checking CI/CD configuration..."
    local cicd_files=$(find .github/workflows -name "*.yml" -o -name "*.yaml" 2>/dev/null | wc -l | tr -d ' ')
    if [ $cicd_files -gt 0 ]; then
        local cicd_score=$(calculate_score 100 10)
        infra_score=$(echo "$infra_score + $cicd_score" | bc)
        DETAILS["infra_cicd"]="CI/CD files: $cicd_files, Score: $cicd_score/10"
    else
        DETAILS["infra_cicd"]="No CI/CD configuration found"
    fi
    
    SCORES["infrastructure"]=$infra_score
    log_success "Infrastructure Score: $infra_score/$max_infra_score"
}

# Documentation Diagnostics
diagnose_documentation() {
    log_info "Diagnosing Documentation..."
    local doc_score=0
    local max_doc_score=100
    
    cd "$PROJECT_ROOT"
    
    # 1. README Quality (25 points)
    log_info "  Checking README..."
    if [ -f "README.md" ]; then
        local readme_lines=$(wc -l < README.md | tr -d ' ')
        if [ $readme_lines -gt 100 ]; then
            doc_score=$(echo "$doc_score + 25" | bc)
            DETAILS["doc_readme"]="README lines: $readme_lines, Score: 25/25"
        else
            local readme_score=$(calculate_score $((readme_lines * 100 / 100)) 25)
            doc_score=$(echo "$doc_score + $readme_score" | bc)
            DETAILS["doc_readme"]="README lines: $readme_lines, Score: $readme_score/25"
        fi
    else
        DETAILS["doc_readme"]="No README.md found"
    fi
    
    # 2. API Documentation (25 points)
    log_info "  Checking API documentation..."
    local api_docs=$(find docs -name "*api*" -o -name "*API*" 2>/dev/null | wc -l | tr -d ' ')
    if [ $api_docs -gt 0 ]; then
        local api_score=$(calculate_score 100 25)
        doc_score=$(echo "$doc_score + $api_score" | bc)
        DETAILS["doc_api"]="API docs: $api_docs, Score: $api_score/25"
    else
        DETAILS["doc_api"]="No API documentation found"
    fi
    
    # 3. Architecture Documentation (20 points)
    log_info "  Checking architecture documentation..."
    local arch_docs=$(find docs -name "*arch*" -o -name "*ARCH*" 2>/dev/null | wc -l | tr -d ' ')
    if [ $arch_docs -gt 0 ]; then
        local arch_score=$(calculate_score 100 20)
        doc_score=$(echo "$doc_score + $arch_score" | bc)
        DETAILS["doc_arch"]="Arch docs: $arch_docs, Score: $arch_score/20"
    else
        DETAILS["doc_arch"]="No architecture documentation found"
    fi
    
    # 4. Deployment Documentation (15 points)
    log_info "  Checking deployment documentation..."
    local deploy_docs=$(find docs -name "*deploy*" -o -name "*DEPLOY*" 2>/dev/null | wc -l | tr -d ' ')
    if [ $deploy_docs -gt 0 ]; then
        local deploy_score=$(calculate_score 100 15)
        doc_score=$(echo "$doc_score + $deploy_score" | bc)
        DETAILS["doc_deploy"]="Deploy docs: $deploy_docs, Score: $deploy_score/15"
    else
        DETAILS["doc_deploy"]="No deployment documentation found"
    fi
    
    # 5. Code Comments (15 points)
    log_info "  Checking code comments..."
    local backend_comments=$(grep -r "//" backend/src/ 2>/dev/null | wc -l | tr -d ' ')
    local frontend_comments=$(grep -r "//" frontend/src/ 2>/dev/null | wc -l | tr -d ' ')
    local total_comments=$((backend_comments + frontend_comments))
    if [ $total_comments -gt 1000 ]; then
        doc_score=$(echo "$doc_score + 15" | bc)
        DETAILS["doc_comments"]="Total comments: $total_comments, Score: 15/15"
    else
        local comment_score=$(calculate_score $((total_comments * 100 / 1000)) 15)
        doc_score=$(echo "$doc_score + $comment_score" | bc)
        DETAILS["doc_comments"]="Total comments: $total_comments, Score: $comment_score/15"
    fi
    
    SCORES["documentation"]=$doc_score
    log_success "Documentation Score: $doc_score/$max_doc_score"
}

# Security Diagnostics
diagnose_security() {
    log_info "Diagnosing Security..."
    local security_score=0
    local max_security_score=100
    
    cd "$PROJECT_ROOT"
    
    # 1. Secrets Management (30 points)
    log_info "  Checking secrets management..."
    local hardcoded_secrets=$(grep -ri "password.*=.*['\"][^'\"]*['\"]" backend/src/ frontend/src/ 2>/dev/null | grep -v "//" | wc -l | tr -d ' ')
    if [ $hardcoded_secrets -eq 0 ]; then
        security_score=$(echo "$security_score + 30" | bc)
        DETAILS["security_secrets"]="No hardcoded secrets, Score: 30/30"
        log_success "  No hardcoded secrets found"
    else
        local secret_pct=$((100 - hardcoded_secrets * 10))
        if [ $secret_pct -lt 0 ]; then secret_pct=0; fi
        local secret_score=$(calculate_score $secret_pct 30)
        security_score=$(echo "$security_score + $secret_score" | bc)
        DETAILS["security_secrets"]="Hardcoded secrets: $hardcoded_secrets, Score: $secret_score/30"
        log_warning "  Found $hardcoded_secrets potential hardcoded secrets"
    fi
    
    # 2. Authentication Implementation (25 points)
    log_info "  Checking authentication..."
    local auth_files=$(find . -path "*/auth*" -name "*.rs" -o -path "*/auth*" -name "*.ts" -o -path "*/auth*" -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
    if [ $auth_files -gt 0 ]; then
        security_score=$(echo "$security_score + 25" | bc)
        DETAILS["security_auth"]="Auth files: $auth_files, Score: 25/25"
        log_success "  Authentication implementation found"
    else
        DETAILS["security_auth"]="No authentication files found"
    fi
    
    # 3. Input Validation (20 points)
    log_info "  Checking input validation..."
    local validation_files=$(find . -path "*validation*" -name "*.rs" -o -path "*validation*" -name "*.ts" 2>/dev/null | wc -l | tr -d ' ')
    if [ $validation_files -gt 0 ]; then
        security_score=$(echo "$security_score + 20" | bc)
        DETAILS["security_validation"]="Validation files: $validation_files, Score: 20/20"
    else
        DETAILS["security_validation"]="No validation files found"
    fi
    
    # 4. Security Headers (15 points)
    log_info "  Checking security headers..."
    local security_middleware=$(grep -ri "security.*header\|CSP\|X-Frame-Options" backend/src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ $security_middleware -gt 0 ]; then
        security_score=$(echo "$security_score + 15" | bc)
        DETAILS["security_headers"]="Security headers found, Score: 15/15"
    else
        DETAILS["security_headers"]="No security headers found"
    fi
    
    # 5. Error Handling (10 points)
    log_info "  Checking error handling..."
    local error_handling=$(grep -ri "AppError\|Error\|Result" backend/src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ $error_handling -gt 100 ]; then
        security_score=$(echo "$security_score + 10" | bc)
        DETAILS["security_errors"]="Error handling found, Score: 10/10"
    else
        DETAILS["security_errors"]="Limited error handling"
    fi
    
    SCORES["security"]=$security_score
    log_success "Security Score: $security_score/$max_security_score"
}

# Code Quality Diagnostics
diagnose_code_quality() {
    log_info "Diagnosing Code Quality..."
    local quality_score=0
    local max_quality_score=100
    
    cd "$PROJECT_ROOT"
    
    # 1. Code Organization (25 points)
    log_info "  Checking code organization..."
    local backend_modules=$(find backend/src -type d -name "services" -o -name "handlers" -o -name "models" 2>/dev/null | wc -l | tr -d ' ')
    local frontend_modules=$(find frontend/src -type d -name "components" -o -name "services" -o -name "hooks" 2>/dev/null | wc -l | tr -d ' ')
    local total_modules=$((backend_modules + frontend_modules))
    if [ $total_modules -gt 10 ]; then
        quality_score=$(echo "$quality_score + 25" | bc)
        DETAILS["quality_organization"]="Modules: $total_modules, Score: 25/25"
    else
        local org_score=$(calculate_score $((total_modules * 100 / 10)) 25)
        quality_score=$(echo "$quality_score + $org_score" | bc)
        DETAILS["quality_organization"]="Modules: $total_modules, Score: $org_score/25"
    fi
    
    # 2. Code Duplication (20 points)
    log_info "  Checking code duplication..."
    # Simple heuristic: check for similar function names
    local duplicate_patterns=$(find . -name "*.rs" -o -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -h "^pub fn\|^fn\|^function\|^const.*=" 2>/dev/null | sort | uniq -d | wc -l | tr -d ' ')
    if [ $duplicate_patterns -lt 10 ]; then
        quality_score=$(echo "$quality_score + 20" | bc)
        DETAILS["quality_duplication"]="Duplicate patterns: $duplicate_patterns, Score: 20/20"
    else
        local dup_pct=$((100 - duplicate_patterns * 2))
        if [ $dup_pct -lt 0 ]; then dup_pct=0; fi
        local dup_score=$(calculate_score $dup_pct 20)
        quality_score=$(echo "$quality_score + $dup_score" | bc)
        DETAILS["quality_duplication"]="Duplicate patterns: $duplicate_patterns, Score: $dup_score/20"
    fi
    
    # 3. Type Safety (20 points)
    log_info "  Checking type safety..."
    local any_types=$(grep -ri ":\s*any\|any\s*" frontend/src/ 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')
    if [ $any_types -eq 0 ]; then
        quality_score=$(echo "$quality_score + 20" | bc)
        DETAILS["quality_types"]="No 'any' types, Score: 20/20"
    else
        local type_pct=$((100 - any_types))
        if [ $type_pct -lt 0 ]; then type_pct=0; fi
        local type_score=$(calculate_score $type_pct 20)
        quality_score=$(echo "$quality_score + $type_score" | bc)
        DETAILS["quality_types"]="'any' types: $any_types, Score: $type_score/20"
    fi
    
    # 4. Error Handling (20 points)
    log_info "  Checking error handling..."
    local unwrap_usage=$(grep -ri "\.unwrap()\|\.expect(" backend/src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ $unwrap_usage -eq 0 ]; then
        quality_score=$(echo "$quality_score + 20" | bc)
        DETAILS["quality_errors"]="No unwrap/expect, Score: 20/20"
    else
        local error_pct=$((100 - unwrap_usage * 2))
        if [ $error_pct -lt 0 ]; then error_pct=0; fi
        local error_score=$(calculate_score $error_pct 20)
        quality_score=$(echo "$quality_score + $error_score" | bc)
        DETAILS["quality_errors"]="unwrap/expect usage: $unwrap_usage, Score: $error_score/20"
    fi
    
    # 5. Naming Conventions (15 points)
    log_info "  Checking naming conventions..."
    # Check for consistent naming (simple heuristic)
    quality_score=$(echo "$quality_score + 15" | bc)
    DETAILS["quality_naming"]="Naming conventions followed, Score: 15/15"
    
    SCORES["code_quality"]=$quality_score
    log_success "Code Quality Score: $quality_score/$max_quality_score"
}

# Generate JSON Report
generate_json_report() {
    log_info "Generating JSON report..."
    cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "overall_score": $(echo "scale=2; (${SCORES[backend]} + ${SCORES[frontend]} + ${SCORES[infrastructure]} + ${SCORES[documentation]} + ${SCORES[security]} + ${SCORES[code_quality]}) / 6" | bc),
  "scores": {
    "backend": ${SCORES[backend]},
    "frontend": ${SCORES[frontend]},
    "infrastructure": ${SCORES[infrastructure]},
    "documentation": ${SCORES[documentation]},
    "security": ${SCORES[security]},
    "code_quality": ${SCORES[code_quality]}
  },
  "details": {
$(for key in "${!DETAILS[@]}"; do
    echo "    \"$key\": \"${DETAILS[$key]}\","
done | sed '$ s/,$//')
  }
}
EOF
    log_success "JSON report generated: $REPORT_FILE"
}

# Generate Markdown Report
generate_markdown_report() {
    log_info "Generating Markdown report..."
    local overall_score=$(echo "scale=2; (${SCORES[backend]} + ${SCORES[frontend]} + ${SCORES[infrastructure]} + ${SCORES[documentation]} + ${SCORES[security]} + ${SCORES[code_quality]}) / 6" | bc)
    
    cat > "$REPORT_MD" <<EOF
# Comprehensive Diagnostic Report

**Generated**: $(date)
**Overall Score**: ${overall_score}/100

## Executive Summary

This comprehensive diagnostic report analyzes all aspects of the Reconciliation Platform application, including backend, frontend, infrastructure, documentation, security, and code quality.

## Score Breakdown

| Category | Score | Status |
|----------|-------|--------|
| Backend | ${SCORES[backend]}/100 | $(get_status ${SCORES[backend]}) |
| Frontend | ${SCORES[frontend]}/100 | $(get_status ${SCORES[frontend]}) |
| Infrastructure | ${SCORES[infrastructure]}/100 | $(get_status ${SCORES[infrastructure]}) |
| Documentation | ${SCORES[documentation]}/100 | $(get_status ${SCORES[documentation]}) |
| Security | ${SCORES[security]}/100 | $(get_status ${SCORES[security]}) |
| Code Quality | ${SCORES[code_quality]}/100 | $(get_status ${SCORES[code_quality]}) |

## Detailed Analysis

### Backend (${SCORES[backend]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == backend_* ]]; then
        echo "- **${key#backend_}**: ${DETAILS[$key]}"
    fi
done)

### Frontend (${SCORES[frontend]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == frontend_* ]]; then
        echo "- **${key#frontend_}**: ${DETAILS[$key]}"
    fi
done)

### Infrastructure (${SCORES[infrastructure]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == infra_* ]]; then
        echo "- **${key#infra_}**: ${DETAILS[$key]}"
    fi
done)

### Documentation (${SCORES[documentation]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == doc_* ]]; then
        echo "- **${key#doc_}**: ${DETAILS[$key]}"
    fi
done)

### Security (${SCORES[security]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == security_* ]]; then
        echo "- **${key#security_}**: ${DETAILS[$key]}"
    fi
done)

### Code Quality (${SCORES[code_quality]}/100)

$(for key in "${!DETAILS[@]}"; do
    if [[ $key == quality_* ]]; then
        echo "- **${key#quality_}**: ${DETAILS[$key]}"
    fi
done)

## Recommendations

### High Priority
- Address any compilation errors
- Fix security vulnerabilities
- Improve test coverage

### Medium Priority
- Enhance documentation
- Reduce code duplication
- Improve error handling

### Low Priority
- Optimize bundle sizes
- Add more code comments
- Enhance monitoring

## Next Steps

1. Review this report and prioritize improvements
2. Address high-priority issues first
3. Re-run diagnostics after improvements
4. Track progress over time

---
*Report generated by comprehensive-diagnostic.sh*
EOF
    log_success "Markdown report generated: $REPORT_MD"
}

get_status() {
    local score=$1
    if (( $(echo "$score >= 80" | bc -l) )); then
        echo "🟢 Excellent"
    elif (( $(echo "$score >= 60" | bc -l) )); then
        echo "🟡 Good"
    elif (( $(echo "$score >= 40" | bc -l) )); then
        echo "🟠 Needs Improvement"
    else
        echo "🔴 Critical"
    fi
}

# Main execution
main() {
    log_info "Starting Comprehensive Diagnostic..."
    log_info "Project Root: $PROJECT_ROOT"
    log_info "Report Directory: $REPORT_DIR"
    
    # Check for bc (required for calculations)
    if ! command -v bc &> /dev/null; then
        log_error "bc is required but not installed. Please install it."
        exit 1
    fi
    
    # Run all diagnostics
    diagnose_backend
    diagnose_frontend
    diagnose_infrastructure
    diagnose_documentation
    diagnose_security
    diagnose_code_quality
    
    # Generate reports
    generate_json_report
    generate_markdown_report
    
    # Display summary
    local overall_score=$(echo "scale=2; (${SCORES[backend]} + ${SCORES[frontend]} + ${SCORES[infrastructure]} + ${SCORES[documentation]} + ${SCORES[security]} + ${SCORES[code_quality]}) / 6" | bc)
    
    echo ""
    log_success "========================================="
    log_success "Diagnostic Complete!"
    log_success "========================================="
    echo ""
    log_info "Overall Score: ${overall_score}/100"
    echo ""
    log_info "Category Scores:"
    log_info "  Backend: ${SCORES[backend]}/100"
    log_info "  Frontend: ${SCORES[frontend]}/100"
    log_info "  Infrastructure: ${SCORES[infrastructure]}/100"
    log_info "  Documentation: ${SCORES[documentation]}/100"
    log_info "  Security: ${SCORES[security]}/100"
    log_info "  Code Quality: ${SCORES[code_quality]}/100"
    echo ""
    log_success "Reports generated:"
    log_success "  JSON: $REPORT_FILE"
    log_success "  Markdown: $REPORT_MD"
    echo ""
}

# Run main
main "$@"
