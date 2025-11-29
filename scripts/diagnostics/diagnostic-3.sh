#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 3: Security Vulnerabilities
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-3-results.json}"

log_info "Starting Security Vulnerabilities Analysis..."

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

# 1. Check for hard-coded secrets
log_info "Scanning for hard-coded secrets..."
SECRET_PATTERNS=(
    "password.*=.*['\"]"
    "api.*key.*=.*['\"]"
    "secret.*=.*['\"]"
    "token.*=.*['\"]"
    "AUTH_TOKEN"
    "PRIVATE_KEY"
)

SECRET_COUNT=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    COUNT=$(grep -ri "$pattern" --include="*.rs" --include="*.ts" --include="*.tsx" --include="*.js" \
        --exclude-dir=node_modules --exclude-dir=target --exclude-dir=.git \
        --exclude-dir=__tests__ --exclude-dir=tests \
        backend/src frontend/src 2>/dev/null | grep -v "test\|example\|TODO\|FIXME\|TestPassword\|ValidPassword\|NewPassword" | wc -l | awk '{print $1}' || echo "0")
    # Ensure COUNT is a valid number
    if ! [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        COUNT=0
    fi
    SECRET_COUNT=$((SECRET_COUNT + COUNT)) 2>/dev/null || SECRET_COUNT=$SECRET_COUNT
done

if [ "$SECRET_COUNT" -gt 0 ]; then
    log_warning "Found $SECRET_COUNT potential hard-coded secrets"
    add_check "hardcoded_secrets" "error" "$SECRET_COUNT potential secrets found" "Review code for hard-coded credentials"
else
    log_success "No hard-coded secrets detected"
    add_check "hardcoded_secrets" "success" "No secrets found" ""
fi

# 2. Check for SQL injection risks
log_info "Checking for SQL injection risks..."
SQL_RISKS=$(grep -r "query.*+.*req\." --include="*.rs" backend/src 2>/dev/null | wc -l | tr -d ' ')
SQL_RISKS=$((SQL_RISKS + $(grep -r "execute.*format!" --include="*.rs" backend/src 2>/dev/null | wc -l | tr -d ' ')))

if [ "$SQL_RISKS" -gt 0 ]; then
    log_warning "Found $SQL_RISKS potential SQL injection risks"
    add_check "sql_injection" "error" "$SQL_RISKS potential risks" "Use parameterized queries"
else
    log_success "No SQL injection risks detected"
    add_check "sql_injection" "success" "No risks found" ""
fi

# 3. Check for XSS vulnerabilities
log_info "Checking for XSS vulnerabilities..."
XSS_RISKS=$(grep -r "dangerouslySetInnerHTML\|innerHTML" --include="*.tsx" --include="*.ts" \
    frontend/src 2>/dev/null | wc -l | tr -d ' ')

if [ "$XSS_RISKS" -gt 0 ]; then
    log_warning "Found $XSS_RISKS potential XSS risks"
    add_check "xss_risks" "warning" "$XSS_RISKS potential risks" "Review use of innerHTML"
else
    log_success "No XSS risks detected"
    add_check "xss_risks" "success" "No risks found" ""
fi

# 4. Check for eval/exec usage
log_info "Checking for dangerous eval/exec usage..."
EVAL_USAGE=$(grep -r "eval\|exec" --include="*.js" --include="*.ts" --include="*.tsx" \
    frontend/src 2>/dev/null | grep -v "test\|example" | wc -l | tr -d ' ')

if [ "$EVAL_USAGE" -gt 0 ]; then
    log_warning "Found $EVAL_USAGE uses of eval/exec"
    add_check "eval_usage" "error" "$EVAL_USAGE dangerous uses found" "Avoid eval/exec"
else
    log_success "No eval/exec usage detected"
    add_check "eval_usage" "success" "No dangerous usage" ""
fi

# 5. Check NPM security audit
log_info "Running NPM security audit..."
if [ -f "frontend/package.json" ]; then
    cd frontend
    if npm audit --json > /tmp/npm-audit.json 2>&1; then
        CRITICAL=$(jq '.metadata.vulnerabilities.critical' /tmp/npm-audit.json 2>/dev/null || echo "0")
        HIGH=$(jq '.metadata.vulnerabilities.high' /tmp/npm-audit.json 2>/dev/null || echo "0")
        TOTAL=$(jq '.metadata.vulnerabilities.total' /tmp/npm-audit.json 2>/dev/null || echo "0")
        
        if [ "$CRITICAL" -gt 0 ]; then
            log_error "Found $CRITICAL critical vulnerabilities"
            add_check "npm_vulnerabilities" "error" "$CRITICAL critical, $HIGH high vulnerabilities" "Total: $TOTAL"
        elif [ "$HIGH" -gt 0 ]; then
            log_warning "Found $HIGH high severity vulnerabilities"
            add_check "npm_vulnerabilities" "warning" "$HIGH high severity vulnerabilities" "Total: $TOTAL"
        else
            log_success "No critical/high NPM vulnerabilities"
            add_check "npm_vulnerabilities" "success" "No critical/high vulnerabilities" "Total: $TOTAL"
        fi
    fi
    cd ..
fi

# 6. Check Cargo security audit
log_info "Running Cargo security audit..."
if [ -f "backend/Cargo.toml" ] && command -v cargo-audit &> /dev/null; then
    cd backend
    if cargo audit --json > /tmp/cargo-audit.json 2>&1; then
        VULN_COUNT=$(jq '.vulnerabilities.found' /tmp/cargo-audit.json 2>/dev/null || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            log_warning "Found $VULN_COUNT Cargo vulnerabilities"
            add_check "cargo_vulnerabilities" "warning" "$VULN_COUNT vulnerabilities found" ""
        else
            log_success "No Cargo vulnerabilities found"
            add_check "cargo_vulnerabilities" "success" "No vulnerabilities" ""
        fi
    fi
    cd ..
fi

# 7. Check for exposed secrets in git history
log_info "Checking git history for exposed secrets..."
if command -v git &> /dev/null && [ -d ".git" ]; then
    GIT_SECRETS=$(git log -S "password" --all --oneline 2>/dev/null | wc -l | tr -d ' ')
    if [ "$GIT_SECRETS" -gt 10 ]; then
        log_warning "Found $GIT_SECRETS commits mentioning 'password'"
        add_check "git_secrets" "warning" "$GIT_SECRETS commits found" "Review git history"
    else
        log_success "Git history check passed"
        add_check "git_secrets" "success" "No significant issues" ""
    fi
fi

log_success "Security Vulnerabilities Analysis complete"
cat "$RESULTS_FILE" | jq '.'

