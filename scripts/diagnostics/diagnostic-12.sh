#!/bin/bash
# ============================================================================
# DIAGNOSTIC AREA 12: Environment & Configuration
# ============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../lib/common-functions.sh"

RESULTS_FILE="${RESULTS_FILE:-/tmp/diagnostic-12-results.json}"

log_info "Starting Environment & Configuration Analysis..."

echo '{"checks": []}' > "$RESULTS_FILE"

add_check() {
    jq --arg name "$1" --arg status "$2" --arg msg "$3" --arg details "$4" \
        '.checks += [{"name": $name, "status": $status, "message": $msg, "details": $details}]' \
        "$RESULTS_FILE" > "${RESULTS_FILE}.tmp" && mv "${RESULTS_FILE}.tmp" "$RESULTS_FILE"
}

# 1. Environment files
log_info "Checking environment files..."
ENV_FILES=$(find . -maxdepth 2 -name ".env*" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' ')
if [ "$ENV_FILES" -gt 0 ]; then
    log_success "Found $ENV_FILES environment files"
    add_check "env_files" "success" "$ENV_FILES env files" ""
else
    log_warning "No environment files found"
    add_check "env_files" "warning" "No env files" ""
fi

# 2. Required environment variables
log_info "Checking required environment variables..."
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "REDIS_URL")
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -r "$var" .env* 2>/dev/null | grep -q .; then
        MISSING=$((MISSING + 1))
    fi
done

if [ "$MISSING" -eq 0 ]; then
    log_success "All required variables found"
    add_check "required_vars" "success" "All required vars present" ""
else
    log_warning "$MISSING required variables missing"
    add_check "required_vars" "warning" "$MISSING missing" ""
fi

# 3. Configuration files
log_info "Checking configuration files..."
CONFIG_FILES=$(find . -maxdepth 2 \( -name "*.config.*" -o -name "*.toml" -o -name "package.json" -o -name "Cargo.toml" \) \
    -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' ')
log_success "Found $CONFIG_FILES configuration files"
add_check "config_files" "success" "$CONFIG_FILES config files" ""

# 4. Secrets in config
log_info "Checking for secrets in config..."
SECRETS_IN_CONFIG=$(grep -ri "password\|secret\|key" --include="*.toml" --include="*.json" \
    backend frontend 2>/dev/null | grep -v "test\|example" | wc -l | tr -d ' ')
if [ "$SECRETS_IN_CONFIG" -gt 10 ]; then
    log_warning "Found $SECRETS_IN_CONFIG potential secrets in config"
    add_check "secrets_config" "warning" "$SECRETS_IN_CONFIG potential secrets" ""
else
    log_success "No obvious secrets in config"
    add_check "secrets_config" "success" "No secrets found" ""
fi

log_success "Environment & Configuration Analysis complete"
cat "$RESULTS_FILE" | jq '.'

